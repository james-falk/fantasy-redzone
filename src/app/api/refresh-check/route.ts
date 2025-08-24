import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Resource from '@/models/Resource'
import { dailyScheduler } from '@/services/daily-scheduler'

interface RefreshCheckResponse {
  newDataAvailable: boolean
  lastCheckTime: string
  currentTime: string
  resourceCount: number
  youtubeVideosCount: number
  lastResourceTime: string | null
  timeSinceLastResource: number | null // in minutes
  lastIngestionTime: string | null
  nextScheduledIngestion: string | null
  schedulerStatus: 'success' | 'failed' | 'pending' | 'unknown'
  sources: {
    youtube: {
      count: number
      lastUpdate: string | null
    }
    articles: {
      count: number
      lastUpdate: string | null
    }
  }
}

/**
 * Checks if new content has been ingested since the last check
 * Uses efficient querying based on timestamps and resource counts
 */
export async function GET(request: Request) {
  const startTime = Date.now()
  
  try {
    console.log('🔄 [REFRESH_CHECK] Starting refresh check...')
    
    // Get the last check time from query parameters or use a default
    const { searchParams } = new URL(request.url)
    const lastCheckParam = searchParams.get('lastCheck')
    const lastCheckTime = lastCheckParam ? new Date(lastCheckParam) : new Date(Date.now() - 24 * 60 * 60 * 1000) // Default to 24 hours ago
    
    console.log('🔄 [REFRESH_CHECK] Last check time:', lastCheckTime.toISOString())
    
    // Connect to database
    const connection = await connectToDatabase()
    if (!connection) {
      console.error('❌ [REFRESH_CHECK] Database connection failed')
      return NextResponse.json(
        { 
          newDataAvailable: false, 
          error: 'Database connection failed',
          lastCheckTime: lastCheckTime.toISOString(),
          currentTime: new Date().toISOString()
        },
        { status: 503 }
      )
    }
    
    // Get current resource counts
    const totalResources = await Resource.countDocuments({})
    const youtubeVideosCount = await Resource.countDocuments({ source: 'YouTube' })
    const articlesCount = await Resource.countDocuments({ source: { $ne: 'YouTube' } })
    
    console.log('📊 [REFRESH_CHECK] Current counts:', {
      total: totalResources,
      youtube: youtubeVideosCount,
      articles: articlesCount
    })
    
    // Get the most recent resource
    const latestResource = await Resource.findOne(
      {},
      { createdAt: 1, updatedAt: 1, source: 1 },
      { sort: { createdAt: -1 } }
    )
    
    // Get the most recent YouTube video
    const latestYouTubeVideo = await Resource.findOne(
      { source: 'YouTube' },
      { createdAt: 1, updatedAt: 1 },
      { sort: { createdAt: -1 } }
    )
    
    // Get the most recent article (non-YouTube)
    const latestArticle = await Resource.findOne(
      { source: { $ne: 'YouTube' } },
      { createdAt: 1, updatedAt: 1 },
      { sort: { createdAt: -1 } }
    )
    
    // Check if any new resources were created since last check
    const newResourcesSinceLastCheck = await Resource.countDocuments({
      createdAt: { $gt: lastCheckTime }
    })
    
    // Check if any YouTube videos were created since last check
    const newYouTubeVideosSinceLastCheck = await Resource.countDocuments({
      source: 'YouTube',
      createdAt: { $gt: lastCheckTime }
    })
    
    // Check if any articles were created since last check
    const newArticlesSinceLastCheck = await Resource.countDocuments({
      source: { $ne: 'YouTube' },
      createdAt: { $gt: lastCheckTime }
    })
    
    console.log('📊 [REFRESH_CHECK] New content since last check:', {
      total: newResourcesSinceLastCheck,
      youtube: newYouTubeVideosSinceLastCheck,
      articles: newArticlesSinceLastCheck
    })
    
    // Determine if new data is available
    const newDataAvailable = newResourcesSinceLastCheck > 0
    
    // Calculate time since last resource
    let timeSinceLastResource: number | null = null
    if (latestResource) {
      const now = new Date()
      const lastResourceTime = new Date(latestResource.createdAt)
      timeSinceLastResource = Math.floor((now.getTime() - lastResourceTime.getTime()) / (1000 * 60)) // in minutes
    }
    
    // Get scheduler information
    const schedulerState = dailyScheduler.getSchedulerState()
    
    const currentTime = new Date()
    const response: RefreshCheckResponse = {
      newDataAvailable,
      lastCheckTime: lastCheckTime.toISOString(),
      currentTime: currentTime.toISOString(),
      resourceCount: totalResources,
      youtubeVideosCount,
      lastResourceTime: latestResource ? latestResource.createdAt.toISOString() : null,
      timeSinceLastResource,
      lastIngestionTime: schedulerState.lastIngestionTime?.toISOString() || null,
      nextScheduledIngestion: schedulerState.nextScheduledTime.toISOString(),
      schedulerStatus: schedulerState.lastIngestionStatus,
      sources: {
        youtube: {
          count: youtubeVideosCount,
          lastUpdate: latestYouTubeVideo ? latestYouTubeVideo.createdAt.toISOString() : null
        },
        articles: {
          count: articlesCount,
          lastUpdate: latestArticle ? latestArticle.createdAt.toISOString() : null
        }
      }
    }
    
    const duration = Date.now() - startTime
    
    console.log('✅ [REFRESH_CHECK] Check completed:', {
      newDataAvailable,
      duration: `${duration}ms`,
      newContent: {
        total: newResourcesSinceLastCheck,
        youtube: newYouTubeVideosSinceLastCheck,
        articles: newArticlesSinceLastCheck
      }
    })
    
    return NextResponse.json(response)
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ [REFRESH_CHECK] Error during refresh check:', errorMsg)
    
    return NextResponse.json(
      { 
        newDataAvailable: false, 
        error: errorMsg,
        lastCheckTime: new Date().toISOString(),
        currentTime: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * POST method to manually trigger a refresh check
 * Useful for testing or manual refresh requests
 */
export async function POST() {
  try {
    console.log('🔄 [REFRESH_CHECK] Manual refresh check triggered')
    
    // Use current time as last check time for immediate comparison
    const lastCheckTime = new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
    
    const response = await GET(new Request(`/api/refresh-check?lastCheck=${lastCheckTime.toISOString()}`))
    const data = await response.json()
    
    console.log('✅ [REFRESH_CHECK] Manual check completed:', data)
    
    return NextResponse.json({
      ...data,
      manualTrigger: true,
      triggerTime: new Date().toISOString()
    })
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ [REFRESH_CHECK] Manual check error:', errorMsg)
    
    return NextResponse.json(
      { 
        newDataAvailable: false, 
        error: errorMsg,
        manualTrigger: true,
        triggerTime: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
