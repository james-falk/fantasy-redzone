import { NextRequest, NextResponse } from 'next/server'
import { dailyScheduler } from '@/services/daily-scheduler'
import { getEnvVar } from '@/lib/environment'

interface CronResponse {
  success: boolean
  message: string
  ingestionTriggered: boolean
  schedulerState: {
    lastIngestionTime: string | null
    lastIngestionStatus: 'success' | 'failed' | 'pending'
    nextScheduledTime: string
    totalIngestions: number
    successfulIngestions: number
    failedIngestions: number
  } | null
  environment: string
  timestamp: string
}

/**
 * Vercel Cron Job endpoint
 * Called daily at 6:00 AM EST (11:00 UTC) via vercel.json cron configuration
 * 
 * Cron schedule: "0 11 * * *" (every day at 11:00 UTC = 6:00 AM EST)
 */
export async function GET(request: NextRequest): Promise<NextResponse<CronResponse>> {
  try {
    console.log('🕐 [CRON] Daily ingestion cron job triggered')
    
    // Verify this is a legitimate Vercel cron request
    const authHeader = request.headers.get('authorization')
    const isVercelCron = authHeader === `Bearer ${getEnvVar('CRON_SECRET')}`
    
    if (!isVercelCron) {
      console.warn('⚠️ [CRON] Unauthorized cron request - missing or invalid authorization')
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
          ingestionTriggered: false,
          schedulerState: null,
          environment: getEnvVar('NODE_ENV'),
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      )
    }
    
    // Check if it's time for ingestion
    const shouldIngest = dailyScheduler.shouldPerformIngestion()
    
    if (!shouldIngest) {
      console.log('⏰ [CRON] Not yet time for ingestion, skipping...')
      
      const schedulerState = dailyScheduler.getSchedulerState()
      
      return NextResponse.json({
        success: true,
        message: 'Not yet time for ingestion',
        ingestionTriggered: false,
        schedulerState: {
          lastIngestionTime: schedulerState.lastIngestionTime?.toISOString() || null,
          lastIngestionStatus: schedulerState.lastIngestionStatus,
          nextScheduledTime: schedulerState.nextScheduledTime.toISOString(),
          totalIngestions: schedulerState.totalIngestions,
          successfulIngestions: schedulerState.successfulIngestions,
          failedIngestions: schedulerState.failedIngestions
        },
        environment: getEnvVar('NODE_ENV'),
        timestamp: new Date().toISOString()
      })
    }
    
    // Perform the daily ingestion
    console.log('🔄 [CRON] Starting scheduled daily ingestion...')
    await dailyScheduler.performDailyIngestion()
    
    const schedulerState = dailyScheduler.getSchedulerState()
    
    console.log('✅ [CRON] Daily ingestion completed via cron job')
    
    return NextResponse.json({
      success: true,
      message: 'Daily ingestion completed successfully',
      ingestionTriggered: true,
      schedulerState: {
        lastIngestionTime: schedulerState.lastIngestionTime?.toISOString() || null,
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
    console.error('❌ [CRON] Error during cron job execution:', errorMsg)
    
    return NextResponse.json(
      {
        success: false,
        message: `Cron job failed: ${errorMsg}`,
        ingestionTriggered: false,
        schedulerState: null,
        environment: getEnvVar('NODE_ENV'),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
