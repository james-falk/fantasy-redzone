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

// Simple in-memory cache to prevent excessive database queries
let cache: {
  data: RefreshCheckResponse | null
  timestamp: number
  lastCheckTime: string
} | null = null

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes cache

/**
 * Checks if new content has been ingested since the last check
 * Uses efficient querying based on timestamps and resource counts
 * Now includes caching to prevent excessive database queries
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
    
    // Check cache first
    const now = Date.now()
    if (cache && 
        (now - cache.timestamp) < CACHE_DURATION && 
        cache.lastCheckTime === lastCheckTime.toISOString()) {
      console.log('✅ [REFRESH_CHECK] Returning cached response')
      return NextResponse.json(cache.data)
    }
    
    // Connect to database
    const connection = await connectToDatabase()
    if (!connection) {
      console.error('❌ [REFRESH_CHECK] Database connection failed')
      const errorResponse = {
        newDataAvailable: false, 
        error: 'Database connection failed',
        lastCheckTime: lastCheckTime.toISOString(),
        currentTime: new Date().toISOString()
      }
      return NextResponse.json(errorResponse, { status: 503 })
    }
    
    // OPTIMIZED: Use a single aggregation pipeline to get all the data we need
    const aggregationResult = await Resource.aggregate([
      {
        $facet: {
          totalCount: [{ $count: "count" }],
          youtubeCount: [{ $match: { source: 'YouTube' } }, { $count: "count" }],
          latestResource: [{ $sort: { createdAt: -1 } }, { $limit: 1 }],
          latestYouTube: [{ $match: { source: 'YouTube' } }, { $sort: { createdAt: -1 } }, { $limit: 1 }],
          latestArticle: [{ $match: { source: { $ne: 'YouTube' } } }, { $sort: { createdAt: -1 } }, { $limit: 1 }],
          newSinceLastCheck: [{ $match: { createdAt: { $gt: lastCheckTime } } }, { $count: "count" }],
          newYouTubeSinceLastCheck: [{ $match: { source: 'YouTube', createdAt: { $gt: lastCheckTime } } }, { $count: "count" }],
          newArticlesSinceLastCheck: [{ $match: { source: { $ne: 'YouTube' }, createdAt: { $gt: lastCheckTime } } }, { $count: "count" }]
        }
      }
    ])
    
    const result = aggregationResult[0]
    
    // Extract values from aggregation result
    const totalResources = result.totalCount[0]?.count || 0
    const youtubeVideosCount = result.youtubeCount[0]?.count || 0
    const articlesCount = totalResources - youtubeVideosCount
    
    const latestResource = result.latestResource[0] || null
    const latestYouTubeVideo = result.latestYouTube[0] || null
    const latestArticle = result.latestArticle[0] || null
    
    const newResourcesSinceLastCheck = result.newSinceLastCheck[0]?.count || 0
    const newYouTubeVideosSinceLastCheck = result.newYouTubeSinceLastCheck[0]?.count || 0
    const newArticlesSinceLastCheck = result.newArticlesSinceLastCheck[0]?.count || 0
    
    console.log('📊 [REFRESH_CHECK] Current counts:', {
      total: totalResources,
      youtube: youtubeVideosCount,
      articles: articlesCount
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
    
    // Cache the response
    cache = {
      data: response,
      timestamp: now,
      lastCheckTime: lastCheckTime.toISOString()
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
    
    // Clear cache for manual refresh
    cache = null
    
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
