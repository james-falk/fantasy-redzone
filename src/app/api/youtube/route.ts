import { google } from 'googleapis'
import { NextRequest, NextResponse } from 'next/server'
import NodeCache from 'node-cache'
import { YouTubeContent, APIResponse } from '@/types/content'

// Initialize cache with 30-minute TTL
const cache = new NodeCache({ stdTTL: 30 * 60 })

// OAuth2 client for server-side authentication (site owner's account)
const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI
)

// Set stored refresh token for server-side access
if (process.env.YOUTUBE_REFRESH_TOKEN) {
  oauth2Client.setCredentials({
    refresh_token: process.env.YOUTUBE_REFRESH_TOKEN
  })
}

// Use OAuth2 for authenticated access to your account
const youtube = google.youtube({
  version: 'v3',
  auth: oauth2Client,
})

// Mapping for fantasy football categories based on video titles/descriptions
const categorizeVideo = (title: string, description: string): string => {
  const titleLower = title.toLowerCase()
  const descLower = description.toLowerCase()
  
  if (titleLower.includes('dynasty') || descLower.includes('dynasty')) return 'Dynasty'
  if (titleLower.includes('rookie') || descLower.includes('rookie')) return 'Rookies'
  if (titleLower.includes('trade') || descLower.includes('trade')) return 'Trades'
  if (titleLower.includes('waiver') || descLower.includes('waiver')) return 'Waiver Wire'
  if (titleLower.includes('start') || titleLower.includes('sit') || descLower.includes('start')) return 'Start/Sit'
  if (titleLower.includes('ranking') || descLower.includes('ranking')) return 'Rankings'
  if (titleLower.includes('news') || descLower.includes('news')) return 'News'
  if (titleLower.includes('podcast') || descLower.includes('podcast')) return 'Podcasts'
  
  return 'Analysis' // Default category
}

// Extract tags from video title and description
const extractTags = (title: string, description: string): string[] => {
  const tags: string[] = []
  const text = `${title} ${description}`.toLowerCase()
  
  // Common fantasy football terms
  const tagMap = {
    'ppr': 'PPR',
    'standard': 'Standard',
    'half ppr': 'Half-PPR',
    'superflex': 'Superflex',
    '2qb': '2QB',
    'te premium': 'TE Premium',
    'idp': 'IDP',
    'best ball': 'Best Ball',
    'dfs': 'DFS',
    'daily fantasy': 'DFS'
  }
  
  Object.entries(tagMap).forEach(([key, tag]) => {
    if (text.includes(key) && !tags.includes(tag)) {
      tags.push(tag)
    }
  })
  
  return tags
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams: urlParams } = new URL(request.url)
    const query = urlParams.get('q') || 'fantasy football'
    const maxResults = parseInt(urlParams.get('maxResults') || '20')
    const channelId = urlParams.get('channelId')
    
    // Debug logging
    console.log('YouTube API Request:', { query, maxResults, channelId })
    console.log('Auth method:', process.env.YOUTUBE_API_KEY ? 'API Key' : 'OAuth2')
    console.log('Has API Key:', !!process.env.YOUTUBE_API_KEY)
    console.log('Has Refresh Token:', !!process.env.YOUTUBE_REFRESH_TOKEN)
    
    // OAuth2 is now configured with hardcoded refresh token
    console.log('✅ YouTube OAuth2 configured and ready!')
    
    // Create cache key
    const cacheKey = `youtube_${query}_${maxResults}_${channelId || 'all'}`
    
    // Check cache first
    const cachedData = cache.get<YouTubeContent[]>(cacheKey)
    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData,
        cached: true,
        total: cachedData.length
      } as APIResponse<YouTubeContent[]>)
    }

    // Build search parameters
    const searchOptions = {
      part: ['snippet'],
      q: query,
      type: ['video'],
      maxResults: maxResults,
      order: 'relevance' as const,
      publishedAfter: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
      ...(channelId && { channelId })
    }

    // Fetch from YouTube API
    console.log('Making YouTube API request with options:', searchOptions)
    const response = await youtube.search.list(searchOptions)
    console.log('YouTube API response status:', response.status)
    console.log('YouTube API response data keys:', Object.keys(response.data || {}))

    if (!response.data.items) {
      console.log('No items in YouTube response:', response.data)
      return NextResponse.json({
        success: false,
        error: 'No videos found in YouTube response',
        data: []
      } as APIResponse<YouTubeContent[]>)
    }

    console.log(`Found ${response.data.items.length} videos from YouTube`)

    // Get video details for duration and view count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const videoIds = response.data.items.map((item: any) => item.id?.videoId).filter(Boolean)
    const videoDetails = await youtube.videos.list({
      part: ['contentDetails', 'statistics'],
      id: videoIds as string[]
    })

    // Transform to our content format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const videos: YouTubeContent[] = response.data.items.map((item: any, index: number) => {
      const snippet = item.snippet
      const videoDetail = videoDetails.data.items?.[index]
      const videoId = item.id?.videoId
      
      if (!snippet || !videoId) {
        throw new Error('Invalid video data from YouTube API')
      }
      
      const title = snippet.title || 'Untitled Video'
      const description = snippet.description || ''
      const category = categorizeVideo(title, description)
      const tags = extractTags(title, description)

      // Get the best available thumbnail
      const thumbnail = snippet.thumbnails?.maxres?.url || 
                       snippet.thumbnails?.high?.url || 
                       snippet.thumbnails?.medium?.url || 
                       snippet.thumbnails?.default?.url || 
                       `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`

      return {
        id: `youtube_${videoId}`,
        title,
        shortDescription: description.slice(0, 200) + (description.length > 200 ? '...' : ''),
        cover: thumbnail,
        slug: `youtube-${videoId}`,
        category,
        publishDate: snippet.publishedAt || new Date().toISOString(),
        source: 'youtube' as const,
        tags,
        videoId,
        channelTitle: snippet.channelTitle || 'Unknown Channel',
        duration: videoDetail?.contentDetails?.duration || 'Unknown',
        viewCount: parseInt(videoDetail?.statistics?.viewCount || '0'),
        url: `https://www.youtube.com/watch?v=${videoId}`,
        // Additional metadata for better display
        thumbnail: thumbnail,
        creatorName: snippet.channelTitle || 'Unknown Channel'
      }
    })

    // Cache the results
    cache.set(cacheKey, videos)

    // Log the videos for debugging
    console.log('='.repeat(50))
    console.log('🎥 YOUTUBE VIDEOS RETRIEVED:')
    console.log('='.repeat(50))
    videos.forEach((video, index) => {
      console.log(`${index + 1}. ${video.title}`)
      console.log(`   Channel: ${video.creatorName}`)
      console.log(`   Category: ${video.category}`)
      console.log(`   Published: ${video.publishDate}`)
      console.log(`   Thumbnail: ${video.thumbnail}`)
      console.log(`   URL: ${video.url}`)
      console.log(`   Tags: ${video.tags.join(', ')}`)
      console.log('---')
    })
    console.log('='.repeat(50))

    return NextResponse.json({
      success: true,
      data: videos,
      cached: false,
      total: videos.length
    } as APIResponse<YouTubeContent[]>)

  } catch (error) {
    console.error('🚨 YouTube API Error Details:')
    console.error('Error type:', error?.constructor?.name)
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error')
    console.error('Full error:', error)
    
    // Check if it's an authentication error
    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json({
        success: false,
        error: 'Invalid YouTube API key. Please check your YOUTUBE_API_KEY in .env.local',
        data: []
      } as APIResponse<YouTubeContent[]>, { status: 401 })
    }
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch YouTube content',
      data: []
    } as APIResponse<YouTubeContent[]>, { status: 500 })
  }
} 