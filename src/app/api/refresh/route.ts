import { NextRequest, NextResponse } from 'next/server'
import NodeCache from 'node-cache'
import { logger, LogContext, ContentUpdatePayload } from '@/lib/logger'

// Error codes for better debugging and monitoring
const ERROR_CODES = {
  AUTH_FAILED: 'REFRESH_001',
  TOKEN_HEALTH_FAILED: 'REFRESH_002',
  YOUTUBE_SUBSCRIPTIONS_FAILED: 'REFRESH_003',
  RSS_FAILED: 'REFRESH_004',
  NEWS_FAILED: 'REFRESH_005',
  GENERAL_FAILURE: 'REFRESH_006',
  CACHE_CLEAR_FAILED: 'REFRESH_007',
  NETWORK_TIMEOUT: 'REFRESH_008'
} as const

// This endpoint will be called daily to refresh all cached content
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const refreshId = `refresh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const context = logger.createRequestContext(refreshId, {
    operation: 'daily_refresh',
    userAgent: request.headers.get('user-agent')
  })
  
  try {
    // Verify the request is authorized (basic security)
    const authHeader = request.headers.get('authorization')
    const expectedAuth = `Bearer ${process.env.REFRESH_TOKEN || 'default-refresh-token'}`
    
    if (authHeader !== expectedAuth) {
      logger.error('Authentication failed - Invalid refresh token', new Error(ERROR_CODES.AUTH_FAILED), {
        ...context,
        errorCode: ERROR_CODES.AUTH_FAILED,
        providedAuth: authHeader ? 'Bearer [REDACTED]' : 'null'
      })
      
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        errorCode: ERROR_CODES.AUTH_FAILED,
        refreshId,
        timestamp: new Date().toISOString()
      }, { status: 401 })
    }

    logger.info('🔄 Starting daily content refresh', {
      ...context,
      baseUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      triggeredBy: request.headers.get('user-agent') || 'unknown'
    })

    // Clear all caches to force fresh data
    try {
      const cache = new NodeCache()
      cache.flushAll()
      logger.info('✅ Cache cleared successfully', context)
    } catch (cacheError) {
      logger.warn('Cache clear failed - continuing with refresh', {
        ...context,
        errorCode: ERROR_CODES.CACHE_CLEAR_FAILED
      }, {
        error: cacheError instanceof Error ? cacheError.message : 'Unknown cache error'
      })
    }

    // Pre-warm the caches by fetching fresh content
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    
    // First, check YouTube token health
    logger.info('🔍 Checking YouTube OAuth token health', context)
    let tokenHealthStatus = 'unknown'
    try {
      const tokenHealthResponse = await fetch(`${baseUrl}/api/youtube/refresh-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REFRESH_TOKEN || 'default-refresh-token'}`
        },
        signal: AbortSignal.timeout(15000) // 15 second timeout
      })
      
      if (tokenHealthResponse.ok) {
        const tokenHealth = await tokenHealthResponse.json()
        tokenHealthStatus = tokenHealth.tokenStatus || 'valid'
        logger.oauthTokenSuccess('health_check', tokenHealthStatus, context)
      } else {
        tokenHealthStatus = `failed_${tokenHealthResponse.status}`
        logger.warn('YouTube token health check failed', {
          ...context,
          errorCode: ERROR_CODES.TOKEN_HEALTH_FAILED
        }, {
          status: tokenHealthResponse.status,
          statusText: tokenHealthResponse.statusText
        })
      }
    } catch (tokenError) {
      tokenHealthStatus = 'error'
      logger.error('YouTube token health check failed', tokenError instanceof Error ? tokenError : new Error('Unknown token error'), {
        ...context,
        errorCode: ERROR_CODES.TOKEN_HEALTH_FAILED,
        isTimeout: tokenError instanceof Error && tokenError.name === 'AbortError'
      })
    }

    const refreshPromises = [
      // Refresh YouTube subscriptions (most recent videos from subscribed channels)
      {
        name: 'YouTube Subscriptions',
        promise: fetch(`${baseUrl}/api/youtube/subscriptions?maxResults=50&daysBack=3`, {
          signal: AbortSignal.timeout(30000) // 30 second timeout
        }),
        source: 'youtube' as const,
        errorCode: ERROR_CODES.YOUTUBE_SUBSCRIPTIONS_FAILED
      },
      // Refresh RSS content
      {
        name: 'RSS Articles',
        promise: fetch(`${baseUrl}/api/rss?limit=25`, {
          signal: AbortSignal.timeout(20000) // 20 second timeout
        }),
        source: 'rss' as const,
        errorCode: ERROR_CODES.RSS_FAILED
      },
      // Refresh news content
      {
        name: 'News Articles',
        promise: fetch(`${baseUrl}/api/news?limit=40`, {
          signal: AbortSignal.timeout(25000) // 25 second timeout
        }),
        source: 'news' as const,
        errorCode: ERROR_CODES.NEWS_FAILED
      }
    ]

    logger.info('🚀 Starting parallel content refresh', context, {
      sources: refreshPromises.map(p => p.name),
      timeouts: ['30s', '20s', '25s']
    })

    const results = await Promise.allSettled(refreshPromises.map(p => p.promise))
    
    let successCount = 0
    let errorCount = 0
    const detailedResults: Array<{source: string, status: 'success' | 'failed', error?: string, errorCode?: string, responseTime?: number, payload?: unknown}> = []

    for (let index = 0; index < results.length; index++) {
      const result = results[index]
      const { name, source, errorCode } = refreshPromises[index]
      const requestStartTime = Date.now()
      
      if (result.status === 'fulfilled') {
        try {
          // Parse the response to get detailed payload information
          const response = result.value
          const responseData = await response.json()
          const responseTime = Date.now() - requestStartTime
          
          if (response.ok && responseData.success) {
            // Create detailed payload for logging
            const payload: ContentUpdatePayload = {
              source,
              count: responseData.data?.length || responseData.total || 0,
              cached: responseData.cached || false,
              responseTime,
              ...(source === 'youtube' && { subscriptions: responseData.subscriptions }),
              ...(source === 'news' && { sources: responseData.sources }),
              items: responseData.data?.slice(0, 5).map((item: { id: string; title?: string; publishDate?: string; category?: string; channelTitle?: string; viewCount?: number }) => ({
                id: item.id,
                title: item.title ? item.title.substring(0, 100) + (item.title.length > 100 ? '...' : '') : 'Untitled',
                publishDate: item.publishDate,
                category: item.category,
                ...(source === 'youtube' && { 
                  channelTitle: item.channelTitle,
                  viewCount: item.viewCount 
                })
              })) || []
            }

            logger.contentUpdateSuccess(name, payload, {
              ...context,
              responseTime,
              cached: responseData.cached
            })

            successCount++
            detailedResults.push({ 
              source: name, 
              status: 'success', 
              responseTime, 
              payload: {
                count: payload.count,
                cached: payload.cached,
                sampleItems: payload.items?.length || 0
              }
            })
          } else {
            throw new Error(responseData.error || 'API returned unsuccessful response')
          }
        } catch (parseError) {
          logger.error(`Failed to parse ${name} response`, parseError instanceof Error ? parseError : new Error('Parse error'), {
            ...context,
            errorCode,
            source
          })
          errorCount++
          detailedResults.push({ 
            source: name, 
            status: 'failed', 
            error: parseError instanceof Error ? parseError.message : 'Parse error',
            errorCode
          })
        }
      } else {
        const isTimeout = result.reason instanceof Error && result.reason.name === 'AbortError'
        
        logger.error(`${name} refresh failed`, result.reason instanceof Error ? result.reason : new Error('Unknown error'), {
          ...context,
          errorCode,
          isTimeout,
          source
        })
        
        errorCount++
        detailedResults.push({ 
          source: name, 
          status: 'failed', 
          error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
          errorCode
        })
      }
    }

    const duration = Date.now() - startTime
    
    // Log comprehensive completion summary
    logger.cronSuccess('daily_content_refresh', {
      summary: {
        successful: successCount,
        failed: errorCount,
        duration,
        tokenHealth: tokenHealthStatus
      },
      detailed: detailedResults,
      performance: {
        averageResponseTime: detailedResults
          .filter(r => r.responseTime)
          .reduce((acc, r) => acc + (r.responseTime || 0), 0) / 
          detailedResults.filter(r => r.responseTime).length || 0,
        totalContentItems: detailedResults
          .filter(r => r.payload && typeof r.payload === 'object' && 'count' in r.payload)
          .reduce((acc, r) => acc + (r.payload && typeof r.payload === 'object' && 'count' in r.payload ? (r.payload.count as number) || 0 : 0), 0),
        cacheHitRate: detailedResults
          .filter(r => r.payload && typeof r.payload === 'object' && 'cached' in r.payload && r.payload.cached)
          .length / successCount * 100 || 0
      }
    }, {
      ...context,
      duration,
      successRate: Math.round((successCount / (successCount + errorCount)) * 100)
    })

    return NextResponse.json({
      success: true,
      message: 'Daily refresh completed',
      refreshId,
      results: {
        successful: successCount,
        failed: errorCount,
        timestamp: new Date().toISOString(),
        duration,
        tokenHealth: tokenHealthStatus,
        detailed: detailedResults
      }
    })

  } catch (error) {
    const duration = Date.now() - startTime
    
    logger.error('Daily refresh failed with critical error', error instanceof Error ? error : new Error('Unknown error'), {
      ...context,
      errorCode: ERROR_CODES.GENERAL_FAILURE,
      duration,
      phase: 'general_execution'
    })
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Refresh failed',
      errorCode: ERROR_CODES.GENERAL_FAILURE,
      refreshId,
      duration,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// GET endpoint for manual testing
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Daily refresh endpoint is active',
    instructions: [
      'Send a POST request with Authorization: Bearer YOUR_REFRESH_TOKEN',
      'Or set up a daily cron job to call this endpoint',
      'Add REFRESH_TOKEN to your .env.local for security'
    ]
  })
}