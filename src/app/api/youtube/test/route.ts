import { NextResponse } from 'next/server'
import YouTubeAPIService from '@/services/youtube'

export async function GET() {
  try {
    console.log('Testing YouTube API connection...')

    // Check if API key is available
    const apiKey = process.env.YOUTUBE_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'YOUTUBE_API_KEY environment variable is not set',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    const youtubeService = new YouTubeAPIService()

    // Test with a known fantasy football channel
    const testChannelId = 'UCq-Fj5jknLsUf-MWSy4_brA' // ESPN Fantasy Football
    
    console.log(`Testing with channel ID: ${testChannelId}`)

    // Get channel info
    const channelInfo = await youtubeService.getChannelInfo(testChannelId)
    
    if (!channelInfo) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch channel information',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    // Get a few videos from the channel
    const videos = await youtubeService.getChannelVideos(testChannelId, 5)
    
    if (videos.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No videos found in test channel',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    // Test video conversion
    const sampleVideo = videos[0]
    const convertedResource = youtubeService.convertVideoToResource(sampleVideo)

    return NextResponse.json({
      success: true,
      message: 'YouTube API test completed successfully',
      apiKeyStatus: 'Present',
      channelInfo: {
        id: channelInfo.id,
        title: channelInfo.title,
        description: channelInfo.description?.substring(0, 100) + '...',
        subscriberCount: channelInfo.subscriberCount,
        videoCount: channelInfo.videoCount
      },
      videosFound: videos.length,
      sampleVideo: {
        id: sampleVideo.id,
        title: sampleVideo.title,
        channelTitle: sampleVideo.channelTitle,
        publishedAt: sampleVideo.publishedAt,
        viewCount: sampleVideo.viewCount,
        likeCount: sampleVideo.likeCount
      },
      convertedResource: {
        title: convertedResource.title,
        url: convertedResource.url,
        source: convertedResource.source,
        author: convertedResource.author,
        category: convertedResource.category,
        keywords: convertedResource.keywords?.slice(0, 5) // Show first 5 keywords
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('YouTube API test error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
