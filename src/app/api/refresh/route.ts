import { NextRequest, NextResponse } from 'next/server'
import NodeCache from 'node-cache'

// This endpoint will be called daily to refresh all cached content
export async function POST(request: NextRequest) {
  try {
    // Verify the request is authorized (basic security)
    const authHeader = request.headers.get('authorization')
    const expectedAuth = `Bearer ${process.env.REFRESH_TOKEN || 'default-refresh-token'}`
    
    if (authHeader !== expectedAuth) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    console.log('🔄 Starting daily content refresh...')

    // Clear all caches to force fresh data
    const cache = new NodeCache()
    cache.flushAll()
    console.log('✅ Cleared all caches')

    // Pre-warm the caches by fetching fresh content
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const refreshPromises = [
      // Refresh YouTube subscriptions (most recent videos from subscribed channels)
      fetch(`${baseUrl}/api/youtube/subscriptions?maxResults=50&daysBack=3`),
      // Refresh multiple YouTube searches for broader coverage
      fetch(`${baseUrl}/api/youtube?q=fantasy+football+2024&maxResults=15`),
      fetch(`${baseUrl}/api/youtube?q=fantasy+football+news&maxResults=10`),
      fetch(`${baseUrl}/api/youtube?q=fantasy+football+rankings&maxResults=10`),
      // Refresh RSS content
      fetch(`${baseUrl}/api/rss?limit=20`),
      // Refresh news content
      fetch(`${baseUrl}/api/news?limit=25`)
    ]

    const results = await Promise.allSettled(refreshPromises)
    
    let successCount = 0
    let errorCount = 0

    results.forEach((result, index) => {
      const sources = ['YouTube Subscriptions', 'YouTube General', 'YouTube News', 'YouTube Rankings', 'RSS', 'News Articles']
      if (result.status === 'fulfilled') {
        console.log(`✅ Refreshed ${sources[index]}`)
        successCount++
      } else {
        console.error(`❌ Failed to refresh ${sources[index]}:`, result.reason)
        errorCount++
      }
    })

    console.log(`🎉 Daily refresh complete: ${successCount} success, ${errorCount} errors`)

    return NextResponse.json({
      success: true,
      message: 'Daily refresh completed',
      results: {
        successful: successCount,
        failed: errorCount,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Daily refresh failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Refresh failed'
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