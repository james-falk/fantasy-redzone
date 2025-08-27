import { NextRequest, NextResponse } from 'next/server'
import YouTubeIngestionService from '@/services/youtube-ingestion'
import RSSIngestionService from '@/services/rss-ingestion'
import { getEnvVar } from '@/lib/environment'

interface RefreshResponse {
  success: boolean
  message: string
  result: {
    youtube?: any
    rss?: any
  }
  timestamp: string
  environment: string
}

/**
 * Comprehensive refresh endpoint for local development
 * Calls both YouTube and RSS ingestion services to refresh all content
 */
export async function POST(request: NextRequest): Promise<NextResponse<RefreshResponse>> {
  try {
    console.log('🔄 [REFRESH] Manual refresh triggered')
    
    // Check if we're in development mode
    const isDevelopment = getEnvVar('NODE_ENV') === 'development'
    
    // In development, skip authentication for easier testing
    if (!isDevelopment) {
      const authHeader = request.headers.get('authorization')
      const expectedToken = getEnvVar('REFRESH_TOKEN')
      
      if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
        console.warn('⚠️ [REFRESH] Unauthorized refresh request')
        return NextResponse.json(
          {
            success: false,
            message: 'Unauthorized',
            result: {},
            timestamp: new Date().toISOString(),
            environment: getEnvVar('NODE_ENV')
          },
          { status: 401 }
        )
      }
    }
    
    const result: { youtube?: any; rss?: any } = {}
    let hasSuccess = false
    
    // Perform YouTube ingestion
    try {
      console.log('🔄 [REFRESH] Starting YouTube ingestion...')
      const youtubeService = new YouTubeIngestionService()
      result.youtube = await youtubeService.ingestFromAllSources()
      hasSuccess = true
      console.log('✅ [REFRESH] YouTube ingestion completed')
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      console.error('❌ [REFRESH] YouTube ingestion failed:', errorMsg)
      result.youtube = { error: errorMsg }
    }
    
    // Perform RSS ingestion
    try {
      console.log('🔄 [REFRESH] Starting RSS ingestion...')
      const rssService = new RSSIngestionService()
      result.rss = await rssService.ingestFromAllSources()
      hasSuccess = true
      console.log('✅ [REFRESH] RSS ingestion completed')
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      console.error('❌ [REFRESH] RSS ingestion failed:', errorMsg)
      result.rss = { error: errorMsg }
    }
    
    if (!hasSuccess) {
      throw new Error('Both YouTube and RSS ingestion failed')
    }
    
    console.log('✅ [REFRESH] Refresh completed successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Content refresh completed successfully',
      result,
      timestamp: new Date().toISOString(),
      environment: getEnvVar('NODE_ENV')
    })
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ [REFRESH] Error during refresh:', errorMsg)
    
    return NextResponse.json(
      {
        success: false,
        message: `Refresh failed: ${errorMsg}`,
        result: {},
        timestamp: new Date().toISOString(),
        environment: getEnvVar('NODE_ENV')
      },
      { status: 500 }
    )
  }
}

/**
 * GET method to check refresh endpoint status
 */
export async function GET(): Promise<NextResponse<RefreshResponse>> {
  try {
    console.log('📊 [REFRESH] Status check')
    
    const youtubeService = new YouTubeIngestionService()
    const rssService = new RSSIngestionService()
    
    const youtubeStats = await youtubeService.getIngestionStats()
    const rssStats = { status: 'RSS service available' } // RSS service doesn't have stats method yet
    
    return NextResponse.json({
      success: true,
      message: 'Refresh endpoint is active',
      result: { 
        youtube: { stats: youtubeStats },
        rss: { stats: rssStats }
      },
      timestamp: new Date().toISOString(),
      environment: getEnvVar('NODE_ENV')
    })
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ [REFRESH] Error getting status:', errorMsg)
    
    return NextResponse.json(
      {
        success: false,
        message: `Status check failed: ${errorMsg}`,
        result: {},
        timestamp: new Date().toISOString(),
        environment: getEnvVar('NODE_ENV')
      },
      { status: 500 }
    )
  }
}
