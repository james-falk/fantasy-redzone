import { connectToDatabase } from '@/lib/mongodb'
import YouTubeIngestionService, { IngestionResult } from './youtube-ingestion'
import RSSIngestionService from './rss-ingestion'
import { getEnvVar } from '@/lib/environment'

interface SchedulerState {
  lastIngestionTime: Date | null
  lastIngestionStatus: 'success' | 'failed' | 'pending'
  lastIngestionError?: string
  nextScheduledTime: Date
  totalIngestions: number
  successfulIngestions: number
  failedIngestions: number
  lastYouTubeIngestion?: Date
  lastRSSIngestion?: Date
}

interface IngestionLogData {
  ingestionId: string
  timestamp: Date
  status: 'success' | 'failed'
  duration: number
  youtubeResult: IngestionResult | null
  rssResult: any | null
  error: string | null
  environment: string
}

/**
 * Daily content ingestion scheduler service
 * Handles scheduled ingestion of both YouTube and RSS content at 6:00 AM EST daily
 */
export class DailyScheduler {
  private static instance: DailyScheduler
  private youtubeIngestionService: YouTubeIngestionService
  private rssIngestionService: RSSIngestionService
  private schedulerState: SchedulerState

  private constructor() {
    this.youtubeIngestionService = new YouTubeIngestionService()
    this.rssIngestionService = new RSSIngestionService()
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
   * Perform daily content ingestion (YouTube + RSS)
   */
  public async performDailyIngestion(): Promise<void> {
    const startTime = Date.now()
    const ingestionId = `daily-${new Date().toISOString().split('T')[0]}`
    
    console.log('🔄 [SCHEDULER] Starting daily content ingestion:', {
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

      let youtubeResult: IngestionResult | null = null
      let rssResult: any | null = null
      let youtubeError: string | null = null
      let rssError: string | null = null

      // Perform YouTube ingestion
      try {
        console.log('📺 [SCHEDULER] Starting YouTube ingestion...')
        youtubeResult = await this.youtubeIngestionService.ingestFromAllSources()
        this.schedulerState.lastYouTubeIngestion = new Date()
        console.log('✅ [SCHEDULER] YouTube ingestion completed:', {
          totalVideos: youtubeResult.totalVideos,
          newVideos: youtubeResult.newVideos,
          updatedVideos: youtubeResult.updatedVideos
        })
      } catch (error) {
        youtubeError = error instanceof Error ? error.message : 'Unknown YouTube error'
        console.error('❌ [SCHEDULER] YouTube ingestion failed:', youtubeError)
      }

      // Perform RSS ingestion
      try {
        console.log('📰 [SCHEDULER] Starting RSS ingestion...')
        rssResult = await this.rssIngestionService.ingestFromAllSources()
        this.schedulerState.lastRSSIngestion = new Date()
        console.log('✅ [SCHEDULER] RSS ingestion completed:', {
          totalArticles: rssResult.totalArticles,
          newArticles: rssResult.newArticles,
          updatedArticles: rssResult.updatedArticles
        })
      } catch (error) {
        rssError = error instanceof Error ? error.message : 'Unknown RSS error'
        console.error('❌ [SCHEDULER] RSS ingestion failed:', rssError)
      }

      // Determine overall success
      const hasYouTubeSuccess = youtubeResult && !youtubeError
      const hasRSSSuccess = rssResult && !rssError
      const overallSuccess = hasYouTubeSuccess || hasRSSSuccess // Success if at least one works

      if (overallSuccess) {
        // Update scheduler state on success
        this.schedulerState.lastIngestionTime = new Date()
        this.schedulerState.lastIngestionStatus = 'success'
        this.schedulerState.successfulIngestions++
        this.schedulerState.nextScheduledTime = this.calculateNextScheduledTime()
        
        const duration = Date.now() - startTime
        
        console.log('✅ [SCHEDULER] Daily ingestion completed successfully:', {
          ingestionId,
          duration: `${duration}ms`,
          youtube: hasYouTubeSuccess ? '✅' : '❌',
          rss: hasRSSSuccess ? '✅' : '❌',
          nextScheduledTime: this.schedulerState.nextScheduledTime.toISOString()
        })

        // Log to database for tracking
        await this.logIngestionToDatabase(ingestionId, 'success', duration, youtubeResult, rssResult)
      } else {
        // Both failed
        throw new Error(`YouTube: ${youtubeError}, RSS: ${rssError}`)
      }

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
      await this.logIngestionToDatabase(ingestionId, 'failed', duration, null, null, errorMsg)
    }
  }

  /**
   * Log ingestion results to database
   */
  private async logIngestionToDatabase(
    ingestionId: string, 
    status: 'success' | 'failed', 
    duration: number, 
    youtubeResult?: IngestionResult | null, 
    rssResult?: any | null,
    error?: string
  ): Promise<void> {
    try {
      const connection = await connectToDatabase()
      if (!connection) {
        console.warn('⚠️ [SCHEDULER] Could not log to database - no connection')
        return
      }

      // Create ingestion log document
      const logData: IngestionLogData = {
        ingestionId,
        timestamp: new Date(),
        status,
        duration,
        youtubeResult: youtubeResult || null,
        rssResult: rssResult || null,
        error: error || null,
        environment: getEnvVar('NODE_ENV')
      }

      // For now, we'll use the existing Resource collection to store logs
      // In a production system, you'd want a dedicated IngestionLog collection
      const Resource = (await import('@/models/Resource')).default
      
      await Resource.create({
        title: `Daily Ingestion Log - ${ingestionId}`,
        description: `Scheduled content ingestion ${status}`,
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

  /**
   * Check if content is stale (no ingestion in last 24 hours)
   */
  public isContentStale(): boolean {
    const lastIngestion = this.schedulerState.lastIngestionTime
    if (!lastIngestion) return true
    
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    return lastIngestion < twentyFourHoursAgo
  }

  /**
   * Get ingestion health status
   */
  public getIngestionHealth(): {
    isHealthy: boolean
    lastIngestion: Date | null
    hoursSinceLastIngestion: number
    nextScheduled: Date
    hoursUntilNext: number
    youtubeStatus: 'healthy' | 'stale' | 'never'
    rssStatus: 'healthy' | 'stale' | 'never'
  } {
    const now = new Date()
    const lastIngestion = this.schedulerState.lastIngestionTime
    const hoursSinceLastIngestion = lastIngestion 
      ? Math.floor((now.getTime() - lastIngestion.getTime()) / (1000 * 60 * 60))
      : Infinity
    
    const hoursUntilNext = Math.floor(this.getTimeUntilNextIngestion() / (1000 * 60 * 60))
    
    const youtubeStatus = this.schedulerState.lastYouTubeIngestion
      ? (now.getTime() - this.schedulerState.lastYouTubeIngestion.getTime() < 24 * 60 * 60 * 1000 ? 'healthy' : 'stale')
      : 'never'
    
    const rssStatus = this.schedulerState.lastRSSIngestion
      ? (now.getTime() - this.schedulerState.lastRSSIngestion.getTime() < 24 * 60 * 60 * 1000 ? 'healthy' : 'stale')
      : 'never'
    
    return {
      isHealthy: hoursSinceLastIngestion < 24,
      lastIngestion,
      hoursSinceLastIngestion,
      nextScheduled: this.schedulerState.nextScheduledTime,
      hoursUntilNext,
      youtubeStatus,
      rssStatus
    }
  }
}

// Export singleton instance
export const dailyScheduler = DailyScheduler.getInstance()
