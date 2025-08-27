import { NextResponse } from 'next/server'
import { dailyScheduler } from '@/services/daily-scheduler'
import { connectToDatabase } from '@/lib/mongodb'
import Resource from '@/models/Resource'
import { getEnvVar } from '@/lib/environment'

interface HealthResponse {
  success: boolean
  message: string
  status: 'healthy' | 'warning' | 'critical'
  checks: {
    database: {
      status: 'healthy' | 'warning' | 'critical'
      message: string
      details?: any
    }
    content: {
      status: 'healthy' | 'warning' | 'critical'
      message: string
      details?: any
    }
    scheduler: {
      status: 'healthy' | 'warning' | 'critical'
      message: string
      details?: any
    }
    ingestion: {
      status: 'healthy' | 'warning' | 'critical'
      message: string
      details?: any
    }
  }
  recommendations: string[]
  timestamp: string
  environment: string
}

/**
 * Comprehensive health check endpoint
 * Monitors database, content freshness, scheduler status, and ingestion health
 */
export async function GET(): Promise<NextResponse<HealthResponse>> {
  const startTime = Date.now()
  const recommendations: string[] = []
  
  try {
    console.log('🏥 [HEALTH] Starting comprehensive health check...')
    
    // Initialize response structure
    const response: HealthResponse = {
      success: true,
      message: 'Health check completed',
      status: 'healthy',
      checks: {
        database: { status: 'healthy', message: 'Database connection successful' },
        content: { status: 'healthy', message: 'Content is fresh' },
        scheduler: { status: 'healthy', message: 'Scheduler is running' },
        ingestion: { status: 'healthy', message: 'Ingestion is healthy' }
      },
      recommendations,
      timestamp: new Date().toISOString(),
      environment: getEnvVar('NODE_ENV')
    }

    // Check 1: Database Connection
    try {
      const connection = await connectToDatabase()
      if (!connection) {
        response.checks.database = {
          status: 'critical',
          message: 'Database connection failed'
        }
        response.status = 'critical'
      } else {
        // Get database stats
        const totalResources = await Resource.countDocuments({ isActive: true })
        const youtubeCount = await Resource.countDocuments({ source: 'YouTube', isActive: true })
        const rssCount = await Resource.countDocuments({ source: 'RSS', isActive: true })
        
        response.checks.database.details = {
          totalResources,
          youtubeCount,
          rssCount,
          connectionTime: `${Date.now() - startTime}ms`
        }
        
        if (totalResources < 50) {
          response.checks.database.status = 'warning'
          response.checks.database.message = 'Low content count detected'
          recommendations.push('Run manual refresh to populate content')
        }
      }
    } catch (error) {
      response.checks.database = {
        status: 'critical',
        message: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
      response.status = 'critical'
    }

    // Check 2: Content Freshness
    try {
      const latestResource = await Resource.findOne({ isActive: true })
        .sort({ createdAt: -1 })
        .select('createdAt source')
      
      if (!latestResource) {
        response.checks.content = {
          status: 'critical',
          message: 'No content found in database'
        }
        response.status = 'critical'
        recommendations.push('Database is empty - run initial content ingestion')
      } else {
        const hoursSinceLastContent = (Date.now() - latestResource.createdAt.getTime()) / (1000 * 60 * 60)
        
        response.checks.content.details = {
          latestContent: latestResource.createdAt.toISOString(),
          hoursSinceLastContent: Math.floor(hoursSinceLastContent),
          latestSource: latestResource.source
        }
        
        if (hoursSinceLastContent > 48) {
          response.checks.content.status = 'critical'
          response.checks.content.message = 'Content is very stale (over 48 hours old)'
          response.status = 'critical'
          recommendations.push('Content is very stale - run immediate refresh')
        } else if (hoursSinceLastContent > 24) {
          response.checks.content.status = 'warning'
          response.checks.content.message = 'Content is stale (over 24 hours old)'
          if (response.status === 'healthy') response.status = 'warning'
          recommendations.push('Content is stale - run refresh soon')
        }
      }
    } catch (error) {
      response.checks.content = {
        status: 'critical',
        message: `Content check error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
      response.status = 'critical'
    }

    // Check 3: Scheduler Status
    try {
      const schedulerState = dailyScheduler.getSchedulerState()
      const ingestionHealth = dailyScheduler.getIngestionHealth()
      
      response.checks.scheduler.details = {
        lastIngestion: schedulerState.lastIngestionTime?.toISOString(),
        lastIngestionStatus: schedulerState.lastIngestionStatus,
        nextScheduled: schedulerState.nextScheduledTime.toISOString(),
        totalIngestions: schedulerState.totalIngestions,
        successfulIngestions: schedulerState.successfulIngestions,
        failedIngestions: schedulerState.failedIngestions,
        youtubeStatus: ingestionHealth.youtubeStatus,
        rssStatus: ingestionHealth.rssStatus
      }
      
      if (schedulerState.lastIngestionStatus === 'failed') {
        response.checks.scheduler.status = 'critical'
        response.checks.scheduler.message = 'Last ingestion failed'
        response.status = 'critical'
        recommendations.push('Last scheduled ingestion failed - check logs')
      } else if (ingestionHealth.hoursSinceLastIngestion > 24) {
        response.checks.scheduler.status = 'warning'
        response.checks.scheduler.message = 'No recent scheduled ingestion'
        if (response.status === 'healthy') response.status = 'warning'
        recommendations.push('No recent scheduled ingestion - check cron jobs')
      }
      
      if (ingestionHealth.youtubeStatus === 'stale' || ingestionHealth.rssStatus === 'stale') {
        response.checks.scheduler.status = 'warning'
        response.checks.scheduler.message = 'Some content sources are stale'
        if (response.status === 'healthy') response.status = 'warning'
        recommendations.push('Some content sources are stale - run refresh')
      }
    } catch (error) {
      response.checks.scheduler = {
        status: 'critical',
        message: `Scheduler error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
      response.status = 'critical'
    }

    // Check 4: Ingestion Health
    try {
      const ingestionHealth = dailyScheduler.getIngestionHealth()
      
      response.checks.ingestion.details = {
        isHealthy: ingestionHealth.isHealthy,
        hoursSinceLastIngestion: ingestionHealth.hoursSinceLastIngestion,
        hoursUntilNext: ingestionHealth.hoursUntilNext,
        youtubeStatus: ingestionHealth.youtubeStatus,
        rssStatus: ingestionHealth.rssStatus
      }
      
      if (!ingestionHealth.isHealthy) {
        response.checks.ingestion.status = 'critical'
        response.checks.ingestion.message = 'Ingestion is unhealthy'
        response.status = 'critical'
        recommendations.push('Ingestion system is unhealthy - investigate immediately')
      } else if (ingestionHealth.youtubeStatus === 'never' || ingestionHealth.rssStatus === 'never') {
        response.checks.ingestion.status = 'warning'
        response.checks.ingestion.message = 'Some content types have never been ingested'
        if (response.status === 'healthy') response.status = 'warning'
        recommendations.push('Some content types have never been ingested - run initial ingestion')
      }
    } catch (error) {
      response.checks.ingestion = {
        status: 'critical',
        message: `Ingestion check error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
      response.status = 'critical'
    }

    // Set overall message based on status
    if (response.status === 'critical') {
      response.message = 'Critical issues detected - immediate attention required'
    } else if (response.status === 'warning') {
      response.message = 'Warning issues detected - attention recommended'
    } else {
      response.message = 'All systems healthy'
    }

    const totalTime = Date.now() - startTime
    console.log(`✅ [HEALTH] Health check completed in ${totalTime}ms - Status: ${response.status}`)
    
    return NextResponse.json(response)
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ [HEALTH] Health check failed:', errorMsg)
    
    return NextResponse.json(
      {
        success: false,
        message: `Health check failed: ${errorMsg}`,
        status: 'critical',
        checks: {
          database: { status: 'critical', message: 'Health check failed' },
          content: { status: 'critical', message: 'Health check failed' },
          scheduler: { status: 'critical', message: 'Health check failed' },
          ingestion: { status: 'critical', message: 'Health check failed' }
        },
        recommendations: ['Health check system is broken - investigate immediately'],
        timestamp: new Date().toISOString(),
        environment: getEnvVar('NODE_ENV')
      },
      { status: 500 }
    )
  }
}
