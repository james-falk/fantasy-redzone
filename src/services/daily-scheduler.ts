import { connectToDatabase } from '@/lib/mongodb'
import YouTubeIngestionService from './youtube-ingestion'
import { getEnvVar } from '@/lib/environment'

interface SchedulerState {
  lastIngestionTime: Date | null
  lastIngestionStatus: 'success' | 'failed' | 'pending'
  lastIngestionError?: string
  nextScheduledTime: Date
  totalIngestions: number
  successfulIngestions: number
  failedIngestions: number
}

/**
 * Daily YouTube ingestion scheduler service
 * Handles scheduled ingestion at 6:00 AM EST daily
 */
export class DailyScheduler {
  private static instance: DailyScheduler
  private ingestionService: YouTubeIngestionService
  private schedulerState: SchedulerState

  private constructor() {
    this.ingestionService = new YouTubeIngestionService()
    this.schedulerState = {
      lastIngestionTime: null,
      lastIngestionStatus: 'pending',
      nextScheduledTime: this.calculateNextScheduledTime(),
      totalIngestions: 0,
      successfulIngestions: 0,
      failedIngestions: 0
    }
  }

  public static getInstance(): DailyScheduler {
    if (!DailyScheduler.instance) {
      DailyScheduler.instance = new DailyScheduler()
    }
    return DailyScheduler.instance
  }

  /**
   * Calculate the next scheduled ingestion time (6:00 AM EST)
   */
  private calculateNextScheduledTime(): Date {
    const now = new Date()
    const estOffset = -5 // EST is UTC-5
    const targetHour = 6 // 6:00 AM
    
    // Convert current time to EST
    const estTime = new Date(now.getTime() + (estOffset * 60 * 60 * 1000))
    
    // Set target time to 6:00 AM EST today
    const targetTime = new Date(estTime)
    targetTime.setHours(targetHour, 0, 0, 0)
    
    // If it's already past 6:00 AM EST today, schedule for tomorrow
    if (estTime.getHours() >= targetHour) {
      targetTime.setDate(targetTime.getDate() + 1)
    }
    
    // Convert back to UTC for scheduling
    const utcTargetTime = new Date(targetTime.getTime() - (estOffset * 60 * 60 * 1000))
    
    console.log('📅 [SCHEDULER] Next ingestion scheduled for:', {
      est: targetTime.toISOString(),
      utc: utcTargetTime.toISOString(),
      estFormatted: targetTime.toLocaleString('en-US', { timeZone: 'America/New_York' })
    })
    
    return utcTargetTime
  }

  /**
   * Perform daily YouTube ingestion
   */
  public async performDailyIngestion(): Promise<void> {
    const startTime = Date.now()
    const ingestionId = `daily-${new Date().toISOString().split('T')[0]}`
    
    console.log('🔄 [SCHEDULER] Starting daily YouTube ingestion:', {
      ingestionId,
      startTime: new Date(startTime).toISOString(),
      environment: getEnvVar('NODE_ENV')
    })

    try {
      // Update scheduler state
      this.schedulerState.lastIngestionStatus = 'pending'
      this.schedulerState.totalIngestions++
      
      // Connect to database
      const connection = await connectToDatabase()
      if (!connection) {
        throw new Error('Failed to connect to database')
      }

      // Perform ingestion from all enabled sources
      const result = await this.ingestionService.ingestFromAllSources()
      
      // Update scheduler state on success
      this.schedulerState.lastIngestionTime = new Date()
      this.schedulerState.lastIngestionStatus = 'success'
      this.schedulerState.successfulIngestions++
      this.schedulerState.nextScheduledTime = this.calculateNextScheduledTime()
      
      const duration = Date.now() - startTime
      
      console.log('✅ [SCHEDULER] Daily ingestion completed successfully:', {
        ingestionId,
        duration: `${duration}ms`,
        result: {
          totalProcessed: result.totalProcessed,
          newItems: result.newItems,
          updatedItems: result.updatedItems,
          skippedItems: result.skippedItems
        },
        nextScheduledTime: this.schedulerState.nextScheduledTime.toISOString()
      })

      // Log to database for tracking
      await this.logIngestionToDatabase(ingestionId, 'success', duration, result)

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      const duration = Date.now() - startTime
      
      // Update scheduler state on failure
      this.schedulerState.lastIngestionStatus = 'failed'
      this.schedulerState.lastIngestionError = errorMsg
      this.schedulerState.failedIngestions++
      
      console.error('❌ [SCHEDULER] Daily ingestion failed:', {
        ingestionId,
        duration: `${duration}ms`,
        error: errorMsg
      })

      // Log to database for tracking
      await this.logIngestionToDatabase(ingestionId, 'failed', duration, null, errorMsg)
    }
  }

  /**
   * Log ingestion results to database
   */
  private async logIngestionToDatabase(
    ingestionId: string, 
    status: 'success' | 'failed', 
    duration: number, 
    result?: Record<string, unknown>, 
    error?: string
  ): Promise<void> {
    try {
      const connection = await connectToDatabase()
      if (!connection) {
        console.warn('⚠️ [SCHEDULER] Could not log to database - no connection')
        return
      }

      // Create ingestion log document
      const logData = {
        ingestionId,
        timestamp: new Date(),
        status,
        duration,
        result: result || null,
        error: error || null,
        environment: getEnvVar('NODE_ENV')
      }

      // For now, we'll use the existing Resource collection to store logs
      // In a production system, you'd want a dedicated IngestionLog collection
      const Resource = (await import('@/models/Resource')).default
      
      await Resource.create({
        title: `Daily Ingestion Log - ${ingestionId}`,
        description: `Scheduled YouTube ingestion ${status}`,
        url: `scheduler://${ingestionId}`,
        source: 'Scheduler',
        category: 'System',
        tags: ['scheduler', 'daily-ingestion', status],
        pubDate: new Date(),
        fetchedAt: new Date(),
        rawFeedItem: logData,
        isActive: false // Don't show in regular content
      })

      console.log('📝 [SCHEDULER] Ingestion logged to database:', ingestionId)

    } catch (logError) {
      console.error('❌ [SCHEDULER] Failed to log ingestion to database:', logError)
    }
  }

  /**
   * Get current scheduler state
   */
  public getSchedulerState(): SchedulerState {
    return { ...this.schedulerState }
  }

  /**
   * Check if it's time for daily ingestion
   */
  public shouldPerformIngestion(): boolean {
    const now = new Date()
    return now >= this.schedulerState.nextScheduledTime
  }

  /**
   * Get time until next scheduled ingestion
   */
  public getTimeUntilNextIngestion(): number {
    const now = new Date()
    return Math.max(0, this.schedulerState.nextScheduledTime.getTime() - now.getTime())
  }

  /**
   * Manually trigger ingestion (for testing or manual refresh)
   */
  public async triggerManualIngestion(): Promise<void> {
    console.log('🔄 [SCHEDULER] Manual ingestion triggered')
    await this.performDailyIngestion()
  }
}

// Export singleton instance
export const dailyScheduler = DailyScheduler.getInstance()
