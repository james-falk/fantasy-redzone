import { google } from 'googleapis'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

// OAuth2 client for token refresh
const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI
)

export async function POST(request: NextRequest) {
  const requestId = `token_refresh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const context = logger.createRequestContext(requestId, {
    operation: 'youtube_token_refresh',
    userAgent: request.headers.get('user-agent')
  })
  
  try {
    // Verify the request is authorized (basic security)
    const authHeader = request.headers.get('authorization')
    const expectedAuth = `Bearer ${process.env.REFRESH_TOKEN || 'default-refresh-token'}`
    
    if (authHeader !== expectedAuth) {
      logger.error('YouTube token refresh unauthorized', new Error('Invalid authorization'), {
        ...context,
        providedAuth: authHeader ? 'Bearer [REDACTED]' : 'null'
      })
      
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        requestId,
        timestamp: new Date().toISOString()
      }, { status: 401 })
    }

    logger.info('🔄 Starting YouTube OAuth token refresh', context)

    // Set the current refresh token
    if (!process.env.YOUTUBE_REFRESH_TOKEN) {
      logger.error('No YouTube refresh token configured', new Error('Missing YOUTUBE_REFRESH_TOKEN'), {
        ...context,
        hasClientId: !!process.env.YOUTUBE_CLIENT_ID,
        hasClientSecret: !!process.env.YOUTUBE_CLIENT_SECRET
      })
      
      return NextResponse.json({
        success: false,
        error: 'No refresh token available. Need to re-authenticate.',
        requestId,
        tokenStatus: 'missing',
        timestamp: new Date().toISOString()
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
      logger.info('🔍 Testing current token validity', context)
      const channelResponse = await youtube.channels.list({
        part: ['snippet'],
        mine: true,
        maxResults: 1
      })

      if (channelResponse.data.items && channelResponse.data.items.length > 0) {
        const channelTitle = channelResponse.data.items[0].snippet?.title
        
        logger.oauthTokenSuccess('validation', 'valid', {
          ...context,
          channelTitle,
          channelId: channelResponse.data.items[0].id
        })
        
        return NextResponse.json({
          success: true,
          message: 'Token is valid',
          channelTitle,
          tokenStatus: 'valid',
          requestId,
          timestamp: new Date().toISOString()
        })
      } else {
        throw new Error('No channel data returned')
      }
    } catch (tokenError) {
      logger.info('🔄 Token needs refresh, attempting to refresh', {
        ...context,
        originalError: tokenError instanceof Error ? tokenError.message : 'Unknown error'
      })
      
      try {
        // Force token refresh
        const { credentials } = await oauth2Client.refreshAccessToken()
        
        if (credentials.access_token) {
          logger.info('✅ Successfully refreshed YouTube OAuth token', {
            ...context,
            hasNewAccessToken: !!credentials.access_token,
            expiresIn: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : 'unknown'
          })
          
          // Test again with new token
          const testResponse = await youtube.channels.list({
            part: ['snippet'],
            mine: true,
            maxResults: 1
          })

          const channelTitle = testResponse.data.items?.[0]?.snippet?.title
          
          logger.oauthTokenSuccess('refresh', 'refreshed', {
            ...context,
            channelTitle,
            channelId: testResponse.data.items?.[0]?.id
          })

          return NextResponse.json({
            success: true,
            message: 'Token refreshed successfully',
            channelTitle,
            tokenStatus: 'refreshed',
            newAccessToken: credentials.access_token ? 'present' : 'missing',
            requestId,
            timestamp: new Date().toISOString()
          })
        } else {
          throw new Error('Failed to get new access token')
        }
      } catch (refreshError) {
        logger.error('Token refresh operation failed', refreshError instanceof Error ? refreshError : new Error('Unknown refresh error'), {
          ...context,
          originalError: tokenError instanceof Error ? tokenError.message : 'Unknown token error'
        })
        throw refreshError
      }
    }

  } catch (error) {
    logger.error('YouTube token refresh failed with critical error', error instanceof Error ? error : new Error('Unknown error'), {
      ...context,
      phase: 'token_refresh_critical'
    })
    
    // Check if it's a refresh token error
    if (error instanceof Error && (
      error.message.includes('invalid_grant') || 
      error.message.includes('refresh token') ||
      error.message.includes('expired')
    )) {
      logger.warn('YouTube refresh token expired - re-authentication required', {
        ...context,
        tokenStatus: 'expired',
        reAuthRequired: true
      })
      
      return NextResponse.json({
        success: false,
        error: 'Refresh token expired or invalid. Need to re-authenticate via /api/youtube/setup',
        tokenStatus: 'expired',
        reAuthUrl: '/api/youtube/setup',
        requestId,
        timestamp: new Date().toISOString()
      }, { status: 401 })
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Token refresh failed',
      tokenStatus: 'error',
      requestId,
      timestamp: new Date().toISOString()
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
