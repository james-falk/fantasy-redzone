import { google } from 'googleapis'
import { NextRequest, NextResponse } from 'next/server'

// OAuth2 client for token refresh
const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI
)

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

    console.log('🔄 Starting YouTube OAuth token refresh...')

    // Set the current refresh token
    if (!process.env.YOUTUBE_REFRESH_TOKEN) {
      return NextResponse.json({
        success: false,
        error: 'No refresh token available. Need to re-authenticate.'
      }, { status: 400 })
    }

    oauth2Client.setCredentials({
      refresh_token: process.env.YOUTUBE_REFRESH_TOKEN
    })

    // Test the current token by making a simple API call
    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client,
    })

    try {
      // Try to get user's channel info (lightweight test)
      const channelResponse = await youtube.channels.list({
        part: ['snippet'],
        mine: true,
        maxResults: 1
      })

      if (channelResponse.data.items && channelResponse.data.items.length > 0) {
        console.log('✅ YouTube OAuth token is valid and working')
        return NextResponse.json({
          success: true,
          message: 'Token is valid',
          channelTitle: channelResponse.data.items[0].snippet?.title,
          tokenStatus: 'valid'
        })
      } else {
        throw new Error('No channel data returned')
      }
    } catch (tokenError) {
      console.log('🔄 Token needs refresh, attempting to refresh...')
      
      // Force token refresh
      const { credentials } = await oauth2Client.refreshAccessToken()
      
      if (credentials.access_token) {
        console.log('✅ Successfully refreshed YouTube OAuth token')
        
        // Test again with new token
        const testResponse = await youtube.channels.list({
          part: ['snippet'],
          mine: true,
          maxResults: 1
        })

        return NextResponse.json({
          success: true,
          message: 'Token refreshed successfully',
          channelTitle: testResponse.data.items?.[0]?.snippet?.title,
          tokenStatus: 'refreshed',
          newAccessToken: credentials.access_token ? 'present' : 'missing'
        })
      } else {
        throw new Error('Failed to get new access token')
      }
    }

  } catch (error) {
    console.error('❌ YouTube token refresh failed:', error)
    
    // Check if it's a refresh token error
    if (error instanceof Error && (
      error.message.includes('invalid_grant') || 
      error.message.includes('refresh token') ||
      error.message.includes('expired')
    )) {
      return NextResponse.json({
        success: false,
        error: 'Refresh token expired or invalid. Need to re-authenticate via /api/youtube/setup',
        tokenStatus: 'expired',
        reAuthUrl: '/api/youtube/setup'
      }, { status: 401 })
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Token refresh failed',
      tokenStatus: 'error'
    }, { status: 500 })
  }
}

// GET endpoint for health check
export async function GET(request: NextRequest) {
  try {
    // Simple health check - just verify environment variables exist
    const hasClientId = !!process.env.YOUTUBE_CLIENT_ID
    const hasClientSecret = !!process.env.YOUTUBE_CLIENT_SECRET
    const hasRefreshToken = !!process.env.YOUTUBE_REFRESH_TOKEN

    return NextResponse.json({
      success: true,
      message: 'YouTube OAuth health check',
      config: {
        hasClientId,
        hasClientSecret,
        hasRefreshToken,
        redirectUri: process.env.YOUTUBE_REDIRECT_URI
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Health check failed'
    }, { status: 500 })
  }
}
