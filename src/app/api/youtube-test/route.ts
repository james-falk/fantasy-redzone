import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Check if API key exists
    const hasApiKey = !!process.env.YOUTUBE_API_KEY
    const apiKeyLength = process.env.YOUTUBE_API_KEY?.length || 0
    
    console.log('🔍 YouTube API Test:')
    console.log('- Has API Key:', hasApiKey)
    console.log('- API Key Length:', apiKeyLength)
    
    if (!hasApiKey) {
      return NextResponse.json({
        success: false,
        error: 'YouTube API key is missing',
        debug: {
          hasApiKey: false,
          apiKeyLength: 0,
          envVars: {
            YOUTUBE_API_KEY: 'missing',
            NODE_ENV: process.env.NODE_ENV
          }
        }
      })
    }

    // Test a simple API call
    const testUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=test&type=video&maxResults=1&key=${process.env.YOUTUBE_API_KEY}`
    
    console.log('🧪 Testing YouTube API call...')
    const response = await fetch(testUrl)
    const data = await response.json()
    
    console.log('📊 API Response Status:', response.status)
    console.log('📊 API Response Data:', data)

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      data: response.ok ? 'API key working!' : data,
      debug: {
        hasApiKey: true,
        apiKeyLength,
        responseStatus: response.status,
        envVars: {
          NODE_ENV: process.env.NODE_ENV,
          YOUTUBE_API_KEY: hasApiKey ? `${process.env.YOUTUBE_API_KEY?.substring(0, 10)}...` : 'missing'
        }
      }
    })

  } catch (error) {
    console.error('❌ YouTube API Test Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        hasApiKey: !!process.env.YOUTUBE_API_KEY,
        apiKeyLength: process.env.YOUTUBE_API_KEY?.length || 0,
        errorType: error instanceof Error ? error.constructor.name : 'Unknown'
      }
    })
  }
}
