import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const envVars = {
      YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY ? '✅ Present' : '❌ Missing',
      YOUTUBE_CLIENT_ID: process.env.YOUTUBE_CLIENT_ID ? '✅ Present' : '❌ Missing',
      YOUTUBE_CLIENT_SECRET: process.env.YOUTUBE_CLIENT_SECRET ? '✅ Present' : '❌ Missing',
      YOUTUBE_REFRESH_TOKEN: process.env.YOUTUBE_REFRESH_TOKEN ? '✅ Present' : '❌ Missing',
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
    }

    // Test YouTube API call if key is present
    let youtubeTest = null
    if (process.env.YOUTUBE_API_KEY) {
      try {
        const testResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&q=fantasy+football&type=video&maxResults=1&key=${process.env.YOUTUBE_API_KEY}`
        )
        const testData = await testResponse.json()
        
        if (testResponse.ok && testData.items && testData.items.length > 0) {
          youtubeTest = '✅ YouTube API working - found videos'
        } else {
          youtubeTest = `❌ YouTube API error: ${testData.error?.message || 'No videos found'}`
        }
      } catch (error) {
        youtubeTest = `❌ YouTube API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: envVars,
      youtubeApiTest: youtubeTest,
      message: 'Environment debug info'
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Debug failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
