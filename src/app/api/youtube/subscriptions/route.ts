import { google } from 'googleapis'
import { NextRequest, NextResponse } from 'next/server'
import NodeCache from 'node-cache'
import { YouTubeContent, APIResponse } from '@/types/content'

// Initialize cache with longer TTL for subscriptions (2 hours)
const cache = new NodeCache({ stdTTL: 2 * 60 * 60 })

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

const youtube = google.youtube({
  version: 'v3',
  auth: oauth2Client,
})

// Mapping for fantasy football categories
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
  
  return 'Analysis'
}

// Extract tags from video title and description
const extractTags = (title: string, description: string): string[] => {
  const tags: string[] = []
  const text = `${title} ${description}`.toLowerCase()
  
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
    const { searchParams } = new URL(request.url)
    const maxResults = parseInt(searchParams.get('maxResults') || '50')
    const daysBack = parseInt(searchParams.get('daysBack') || '7') // Default to last 7 days
    
    const cacheKey = `subscriptions_videos_${maxResults}_${daysBack}`
    
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

    // Step 1: Get user's subscriptions
    const subscriptionsResponse = await youtube.subscriptions.list({
      part: ['snippet'],
      mine: true,
      maxResults: 50, // Get up to 50 subscriptions
    })

    if (!subscriptionsResponse.data.items || subscriptionsResponse.data.items.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No subscriptions found or authentication failed',
        data: []
      } as APIResponse<YouTubeContent[]>)
    }

    // Step 2: Get channel IDs from subscriptions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const channelIds = subscriptionsResponse.data.items.map((item: any) => 
      item.snippet?.resourceId?.channelId
    ).filter(Boolean)

    console.log(`Found ${channelIds.length} subscribed channels`)

    // Step 3: Get recent videos from subscribed channels
    const publishedAfter = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString()
    const allVideos: YouTubeContent[] = []

    // Process channels in batches to avoid rate limits
    const batchSize = 5
    for (let i = 0; i < channelIds.length; i += batchSize) {
      const batch = channelIds.slice(i, i + batchSize)
      
      const batchPromises = batch.map(async (channelId: string) => {
        try {
          const searchResponse = await youtube.search.list({
            part: ['snippet'],
            channelId: channelId,
            type: ['video'],
            order: 'date',
            publishedAfter: publishedAfter,
            maxResults: Math.min(10, Math.floor(maxResults / channelIds.length) + 1), // Distribute maxResults across channels
          })

          return searchResponse.data.items || []
        } catch (error) {
          console.error(`Error fetching videos for channel ${channelId}:`, error)
          return []
        }
      })

      const batchResults = await Promise.all(batchPromises)
      const batchVideos = batchResults.flat()

      // Get video details for the batch
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const videoIds = batchVideos.map((item: any) => item.id?.videoId).filter(Boolean)
      
      if (videoIds.length > 0) {
        const videoDetails = await youtube.videos.list({
          part: ['contentDetails', 'statistics'],
          id: videoIds as string[]
        })

        // Transform to our content format
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const transformedVideos: YouTubeContent[] = batchVideos.map((item: any, index: number) => {
          const snippet = item.snippet
          const videoDetail = videoDetails.data.items?.[index]
          const videoId = item.id?.videoId
          
          if (!snippet || !videoId) {
            return null
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
        }).filter(Boolean) as YouTubeContent[]

        allVideos.push(...transformedVideos)
      }

      // Add delay between batches to respect rate limits
      if (i + batchSize < channelIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    // Sort by publish date (newest first) and limit results
    const sortedVideos = allVideos
      .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())
      .slice(0, maxResults)

    // Cache the results
    cache.set(cacheKey, sortedVideos)

    return NextResponse.json({
      success: true,
      data: sortedVideos,
      cached: false,
      total: sortedVideos.length,
      subscriptions: channelIds.length
    } as APIResponse<YouTubeContent[]> & { subscriptions: number })

  } catch (error) {
    console.error('YouTube Subscriptions API Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch subscription videos',
      data: []
    } as APIResponse<YouTubeContent[]>, { status: 500 })
  }
}