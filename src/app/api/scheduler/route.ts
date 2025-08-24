import { NextRequest, NextResponse } from 'next/server'
import { dailyScheduler } from '@/services/daily-scheduler'
import { getEnvVar } from '@/lib/environment'

interface SchedulerResponse {
  success: boolean
  message: string
  schedulerState: {
    lastIngestionTime: string | null
    lastIngestionStatus: 'success' | 'failed' | 'pending'
    lastIngestionError?: string
    nextScheduledTime: string
    totalIngestions: number
    successfulIngestions: number
    failedIngestions: number
    timeUntilNextIngestion: number
  } | null
  environment: string
  timestamp: string
}

/**
 * GET /api/scheduler
 * Get current scheduler status and state
 */
export async function GET(): Promise<NextResponse<SchedulerResponse>> {
  try {
    console.log('📊 [SCHEDULER_API] Getting scheduler status...')
    
    const schedulerState = dailyScheduler.getSchedulerState()
    const timeUntilNext = dailyScheduler.getTimeUntilNextIngestion()
    
    const response: SchedulerResponse = {
      success: true,
      message: 'Scheduler status retrieved successfully',
      schedulerState: {
        lastIngestionTime: schedulerState.lastIngestionTime?.toISOString() || null,
        lastIngestionStatus: schedulerState.lastIngestionStatus,
        lastIngestionError: schedulerState.lastIngestionError,
        nextScheduledTime: schedulerState.nextScheduledTime.toISOString(),
        totalIngestions: schedulerState.totalIngestions,
        successfulIngestions: schedulerState.successfulIngestions,
        failedIngestions: schedulerState.failedIngestions,
        timeUntilNextIngestion: timeUntilNext
      },
      environment: getEnvVar('NODE_ENV'),
      timestamp: new Date().toISOString()
    }
    
    console.log('✅ [SCHEDULER_API] Scheduler status:', {
      lastIngestion: schedulerState.lastIngestionTime?.toISOString(),
      status: schedulerState.lastIngestionStatus,
      nextScheduled: schedulerState.nextScheduledTime.toISOString(),
      timeUntilNext: `${Math.floor(timeUntilNext / (1000 * 60))} minutes`
    })
    
    return NextResponse.json(response)
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ [SCHEDULER_API] Error getting scheduler status:', errorMsg)
    
    return NextResponse.json(
      {
        success: false,
        message: `Failed to get scheduler status: ${errorMsg}`,
        schedulerState: null,
        environment: getEnvVar('NODE_ENV'),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/scheduler
 * Manually trigger daily ingestion
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('🔄 [SCHEDULER_API] Manual ingestion triggered via API')
    
    // Check if we should perform ingestion (optional validation)
    const shouldIngest = dailyScheduler.shouldPerformIngestion()
    
    if (!shouldIngest) {
      console.log('⚠️ [SCHEDULER_API] Manual ingestion requested but not yet scheduled')
    }
    
    // Perform ingestion regardless of schedule (manual override)
    await dailyScheduler.triggerManualIngestion()
    
    const schedulerState = dailyScheduler.getSchedulerState()
    
    console.log('✅ [SCHEDULER_API] Manual ingestion completed successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Manual ingestion completed successfully',
      schedulerState: {
        lastIngestionTime: schedulerState.lastIngestionTime?.toISOString(),
        lastIngestionStatus: schedulerState.lastIngestionStatus,
        nextScheduledTime: schedulerState.nextScheduledTime.toISOString(),
        totalIngestions: schedulerState.totalIngestions,
        successfulIngestions: schedulerState.successfulIngestions,
        failedIngestions: schedulerState.failedIngestions
      },
      environment: getEnvVar('NODE_ENV'),
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ [SCHEDULER_API] Error during manual ingestion:', errorMsg)
    
    return NextResponse.json(
      {
        success: false,
        message: `Manual ingestion failed: ${errorMsg}`,
        environment: getEnvVar('NODE_ENV'),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
