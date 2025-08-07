import { NextRequest, NextResponse } from 'next/server'

// This endpoint can be called by external cron services (like Vercel Cron or GitHub Actions)
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from a cron service
    const cronSecret = request.nextUrl.searchParams.get('secret')
    const expectedSecret = process.env.CRON_SECRET || 'your-cron-secret-here'
    
    if (cronSecret !== expectedSecret) {
      return NextResponse.json({
        success: false,
        error: 'Invalid cron secret'
      }, { status: 401 })
    }

    console.log('⏰ Daily cron job triggered')

    // Call the refresh endpoint
    const refreshUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/refresh`
    const refreshToken = process.env.REFRESH_TOKEN || 'default-refresh-token'

    const response = await fetch(refreshUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${refreshToken}`,
        'Content-Type': 'application/json'
      }
    })

    const result = await response.json()

    if (result.success) {
      console.log('✅ Daily cron job completed successfully')
      return NextResponse.json({
        success: true,
        message: 'Daily refresh completed via cron',
        data: result
      })
    } else {
      console.error('❌ Daily cron job failed:', result.error)
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Cron job error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Cron job failed'
    }, { status: 500 })
  }
}