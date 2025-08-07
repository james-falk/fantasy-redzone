import { google } from 'googleapis'
import { NextRequest, NextResponse } from 'next/server'

// OAuth2 client for initial setup
const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI
)

// Define the scopes we need for subscriptions
const scopes = [
  'https://www.googleapis.com/auth/youtube.readonly',
]

export async function GET(request: NextRequest) {
  try {
    // Debug OAuth2 setup
    console.log('🔧 YouTube OAuth2 Setup (hardcoded credentials for testing)')
    console.log('CLIENT_ID: Present (hardcoded)')
    console.log('CLIENT_SECRET: Present (hardcoded)')
    console.log('REDIRECT_URI: http://localhost:3000/api/youtube/setup')

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      // Step 1: Generate auth URL for initial setup
      console.log('🚀 Generating OAuth2 URL...')
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline', // This is crucial for getting refresh token
        scope: scopes,
        include_granted_scopes: true,
        prompt: 'consent' // Force consent screen to ensure refresh token
      })
      
      console.log('Generated auth URL:', authUrl)

      return NextResponse.json({
        success: true,
        message: 'Visit this URL to authorize the application',
        authUrl: authUrl,
        instructions: [
          '1. Visit the authUrl above',
          '2. Sign in with YOUR YouTube account (the site owner)',
          '3. Grant permissions',
          '4. You will be redirected back with a code parameter',
          '5. The refresh token will be logged to the console - add it to your .env.local'
        ]
      })
    } else {
      // Step 2: Exchange code for tokens
      const { tokens } = await oauth2Client.getToken(code)
      
      console.log('='.repeat(50))
      console.log('YOUTUBE OAUTH2 SETUP COMPLETE!')
      console.log('Add this to your .env.local file:')
      console.log(`YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}`)
      console.log('='.repeat(50))

      return NextResponse.json({
        success: true,
        message: 'Setup complete! Check your console for the refresh token.',
        refreshToken: tokens.refresh_token,
        instructions: [
          `Add this line to your .env.local file:`,
          `YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}`,
          'Then restart your development server',
          'After that, you can delete this setup endpoint for security'
        ]
      })
    }

  } catch (error) {
    console.error('YouTube Setup Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Setup failed'
    }, { status: 500 })
  }
}