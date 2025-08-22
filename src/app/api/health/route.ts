import { NextRequest, NextResponse } from 'next/server'

// Health check endpoint to monitor all system components
export async function GET(request: NextRequest) {
  const healthCheckId = `health_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const startTime = Date.now()
  
  try {
    console.log(`🏥 [${healthCheckId}] Starting comprehensive health check...`)
    
    // Check environment variables
    const envCheck = {
      hasNextPublicSiteUrl: !!process.env.NEXT_PUBLIC_SITE_URL,
      hasCronSecret: !!process.env.CRON_SECRET,
      hasRefreshToken: !!process.env.REFRESH_TOKEN,
      hasYouTubeClientId: !!process.env.YOUTUBE_CLIENT_ID,
      hasYouTubeClientSecret: !!process.env.YOUTUBE_CLIENT_SECRET,
      hasYouTubeRefreshToken: !!process.env.YOUTUBE_REFRESH_TOKEN,
      hasNewsSourcesConfig: !!process.env.NEWS_SOURCES,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'not-configured'
    }
    
    // Test internal API endpoints
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const endpointTests = []
    
    // Test YouTube token health
    try {
      console.log(`🔍 [${healthCheckId}] Testing YouTube token health...`)
      const youtubeHealthResponse = await fetch(`${baseUrl}/api/youtube/refresh-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REFRESH_TOKEN || 'default-refresh-token'}`
        },
        signal: AbortSignal.timeout(10000)
      })
      
      const youtubeHealth = youtubeHealthResponse.ok ? await youtubeHealthResponse.json() : null
      
      endpointTests.push({
        endpoint: '/api/youtube/refresh-token',
        status: youtubeHealthResponse.status,
        ok: youtubeHealthResponse.ok,
        tokenStatus: youtubeHealth?.tokenStatus || 'unknown',
        error: youtubeHealth?.error || null
      })
    } catch (error) {
      endpointTests.push({
        endpoint: '/api/youtube/refresh-token',
        status: 0,
        ok: false,
        tokenStatus: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
    
    // Test RSS endpoint
    try {
      console.log(`🔍 [${healthCheckId}] Testing RSS endpoint...`)
      const rssResponse = await fetch(`${baseUrl}/api/rss?limit=1`, {
        signal: AbortSignal.timeout(10000)
      })
      
      const rssData = rssResponse.ok ? await rssResponse.json() : null
      
      endpointTests.push({
        endpoint: '/api/rss',
        status: rssResponse.status,
        ok: rssResponse.ok,
        dataCount: rssData?.data?.length || 0,
        cached: rssData?.cached || false,
        error: rssData?.error || null
      })
    } catch (error) {
      endpointTests.push({
        endpoint: '/api/rss',
        status: 0,
        ok: false,
        dataCount: 0,
        cached: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
    
    // Test News endpoint
    try {
      console.log(`🔍 [${healthCheckId}] Testing News endpoint...`)
      const newsResponse = await fetch(`${baseUrl}/api/news?limit=1`, {
        signal: AbortSignal.timeout(10000)
      })
      
      const newsData = newsResponse.ok ? await newsResponse.json() : null
      
      endpointTests.push({
        endpoint: '/api/news',
        status: newsResponse.status,
        ok: newsResponse.ok,
        dataCount: newsData?.data?.length || 0,
        cached: newsData?.cached || false,
        sources: newsData?.sources || [],
        error: newsData?.error || null
      })
    } catch (error) {
      endpointTests.push({
        endpoint: '/api/news',
        status: 0,
        ok: false,
        dataCount: 0,
        cached: false,
        sources: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
    
    // Test YouTube subscriptions endpoint
    try {
      console.log(`🔍 [${healthCheckId}] Testing YouTube subscriptions endpoint...`)
      const youtubeSubsResponse = await fetch(`${baseUrl}/api/youtube/subscriptions?maxResults=1`, {
        signal: AbortSignal.timeout(15000)
      })
      
      const youtubeSubsData = youtubeSubsResponse.ok ? await youtubeSubsResponse.json() : null
      
      endpointTests.push({
        endpoint: '/api/youtube/subscriptions',
        status: youtubeSubsResponse.status,
        ok: youtubeSubsResponse.ok,
        dataCount: youtubeSubsData?.data?.length || 0,
        subscriptions: youtubeSubsData?.subscriptions || 0,
        cached: youtubeSubsData?.cached || false,
        error: youtubeSubsData?.error || null
      })
    } catch (error) {
      endpointTests.push({
        endpoint: '/api/youtube/subscriptions',
        status: 0,
        ok: false,
        dataCount: 0,
        subscriptions: 0,
        cached: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
    
    // Calculate overall health
    const workingEndpoints = endpointTests.filter(test => test.ok).length
    const totalEndpoints = endpointTests.length
    const healthScore = Math.round((workingEndpoints / totalEndpoints) * 100)
    
    const duration = Date.now() - startTime
    
    console.log(`🏥 [${healthCheckId}] Health check complete: ${healthScore}% (${workingEndpoints}/${totalEndpoints} endpoints working) in ${duration}ms`)
    
    return NextResponse.json({
      success: true,
      healthCheckId,
      timestamp: new Date().toISOString(),
      duration,
      healthScore,
      summary: {
        workingEndpoints,
        totalEndpoints,
        overallStatus: healthScore >= 75 ? 'healthy' : healthScore >= 50 ? 'degraded' : 'unhealthy'
      },
      environment: envCheck,
      endpoints: endpointTests,
      recommendations: generateRecommendations(envCheck, endpointTests)
    })
    
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`❌ [${healthCheckId}] Health check failed:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration
    })
    
    return NextResponse.json({
      success: false,
      healthCheckId,
      timestamp: new Date().toISOString(),
      duration,
      error: error instanceof Error ? error.message : 'Health check failed',
      healthScore: 0,
      summary: {
        workingEndpoints: 0,
        totalEndpoints: 0,
        overallStatus: 'critical'
      }
    }, { status: 500 })
  }
}

function generateRecommendations(envCheck: any, endpointTests: any[]): string[] {
  const recommendations: string[] = []
  
  // Environment variable recommendations
  if (!envCheck.hasNextPublicSiteUrl) {
    recommendations.push('Set NEXT_PUBLIC_SITE_URL environment variable for proper API calls')
  }
  
  if (!envCheck.hasCronSecret) {
    recommendations.push('Set CRON_SECRET environment variable for secure cron job authentication')
  }
  
  if (!envCheck.hasRefreshToken) {
    recommendations.push('Set REFRESH_TOKEN environment variable for API authentication')
  }
  
  if (!envCheck.hasYouTubeRefreshToken) {
    recommendations.push('Set YOUTUBE_REFRESH_TOKEN by visiting /api/youtube/setup to enable YouTube features')
  }
  
  if (!envCheck.hasNewsSourcesConfig) {
    recommendations.push('Set NEWS_SOURCES environment variable to configure which news sources to fetch')
  }
  
  // Endpoint-specific recommendations
  const failedYouTubeToken = endpointTests.find(test => test.endpoint === '/api/youtube/refresh-token' && !test.ok)
  if (failedYouTubeToken) {
    if (failedYouTubeToken.tokenStatus === 'expired') {
      recommendations.push('YouTube OAuth token has expired. Visit /api/youtube/setup to re-authenticate')
    } else if (failedYouTubeToken.tokenStatus === 'missing') {
      recommendations.push('YouTube OAuth token is missing. Visit /api/youtube/setup to authenticate')
    } else {
      recommendations.push('YouTube OAuth token has issues. Check logs and consider re-authenticating')
    }
  }
  
  const failedRss = endpointTests.find(test => test.endpoint === '/api/rss' && !test.ok)
  if (failedRss) {
    recommendations.push('RSS feed endpoint is failing. Check RSS feed URLs and network connectivity')
  }
  
  const failedNews = endpointTests.find(test => test.endpoint === '/api/news' && !test.ok)
  if (failedNews) {
    recommendations.push('News endpoint is failing. Check NEWS_SOURCES configuration and network connectivity')
  }
  
  const failedYouTubeSubs = endpointTests.find(test => test.endpoint === '/api/youtube/subscriptions' && !test.ok)
  if (failedYouTubeSubs) {
    recommendations.push('YouTube subscriptions endpoint is failing. Ensure OAuth token is valid and you have subscriptions')
  }
  
  return recommendations
}
