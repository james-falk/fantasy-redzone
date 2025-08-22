import { google } from 'googleapis'
import { NextRequest, NextResponse } from 'next/server'
import NodeCache from 'node-cache'
import { YouTubeContent, APIResponse } from '@/types/content'
import { logger } from '@/lib/logger'

// Initialize cache with 30-minute TTL
const cache = new NodeCache({ stdTTL: 30 * 60 })

// Top Fantasy Football YouTube Channels (verified IDs)
const FANTASY_FOOTBALL_CHANNELS = [
  {
    id: 'UCMDHrONRBQ4qdBDzpOZdNRA',
    name: 'FantasyPros',
    priority: 1
  },
  {
    id: 'UC5KHLFhvv6JYkgKGdE2EGqg', 
    name: 'The Fantasy Footballers',
    priority: 1
  },
  {
    id: 'UCvFJ4NRKw5FnhTrMZRcnZFg',
    name: 'Fantasy Football Today',
    priority: 1
  },
  {
    id: 'UC_TiMZzDkBKbLZnE7qCJp4A',
    name: 'NFL',
    priority: 1
  }
]

// Simple YouTube client with API key (no OAuth needed!)
const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY
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
    'daily fantasy': 'DFS',
    'redraft': 'Redraft',
    'keeper': 'Keeper'
  }
  
  Object.entries(tagMap).forEach(([key, tag]) => {
    if (text.includes(key) && !tags.includes(tag)) {
      tags.push(tag)
    }
  })
  
  return tags
}

export async function GET(request: NextRequest) {
  const requestId = `youtube_simple_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const startTime = Date.now()
  const context = logger.createRequestContext(requestId, {
    operation: 'youtube_simple_fetch',
    userAgent: request.headers.get('user-agent')
  })
  
  try {
    // Check if we have the required API key
    if (!process.env.YOUTUBE_API_KEY) {
      logger.error('Missing YouTube API key', new Error('Missing YOUTUBE_API_KEY'), context)
      
      return NextResponse.json({
        success: false,
        error: 'YouTube API not configured. Please add YOUTUBE_API_KEY to environment variables.',
        data: [],
        instructions: [
          '1. Go to Google Cloud Console',
          '2. Enable YouTube Data API v3',
          '3. Create an API Key',
          '4. Add YOUTUBE_API_KEY=your_key to environment variables',
          '5. No OAuth setup needed!'
        ]
      } as APIResponse<YouTubeContent[]>)
    }

    const { searchParams } = new URL(request.url)
    const maxResults = parseInt(searchParams.get('maxResults') || '30')
    const daysBack = parseInt(searchParams.get('daysBack') || '30') // Increased from 7 to 30 days
    
    const cacheKey = `youtube_simple_${maxResults}_${daysBack}`
    
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

    const publishedAfter = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString()
    const allVideos: YouTubeContent[] = []

    // First try general fantasy football search as fallback
    try {
      console.log('🔍 Trying general fantasy football search...')
      const generalSearch = await youtube.search.list({
        part: ['snippet'],
        q: 'fantasy football 2025 rankings analysis',
        type: ['video'],
        order: 'relevance',
        publishedAfter: publishedAfter,
        maxResults: 15,
        relevanceLanguage: 'en',
        regionCode: 'US'
      })

      if (generalSearch.data.items && generalSearch.data.items.length > 0) {
        console.log(`✅ Found ${generalSearch.data.items.length} videos from general search`)
        
        // Get video details
        const videoIds = generalSearch.data.items.map((item) => item.id?.videoId).filter(Boolean) as string[]
        
        if (videoIds.length > 0) {
          const videoDetails = await youtube.videos.list({
            part: ['contentDetails', 'statistics'],
            id: videoIds
          })

          // Transform to our content format
          const transformedVideos: YouTubeContent[] = generalSearch.data.items.map((item, index: number) => {
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
              channelTitle: snippet.channelTitle || 'YouTube',
              duration: videoDetail?.contentDetails?.duration || 'Unknown',
              viewCount: parseInt(videoDetail?.statistics?.viewCount || '0'),
              url: `https://www.youtube.com/watch?v=${videoId}`,
              thumbnail: thumbnail,
              creatorName: snippet.channelTitle || 'YouTube'
            }
          }).filter(Boolean) as YouTubeContent[]

          allVideos.push(...transformedVideos)
        }
      }
    } catch (error) {
      console.error('❌ General search failed:', error)
    }

    // Get videos from each priority channel
    for (const channel of FANTASY_FOOTBALL_CHANNELS) {
      try {
        const videosPerChannel = channel.priority === 1 ? 8 : 4 // Priority channels get more videos
        
                console.log(`🔍 Fetching ${videosPerChannel} videos from ${channel.name}...`)
        
        // First try with date filter
        let searchResponse = await youtube.search.list({
          part: ['snippet'],
          channelId: channel.id,
          type: ['video'],
          order: 'date',
          publishedAfter: publishedAfter,
          maxResults: videosPerChannel,
          relevanceLanguage: 'en',
          regionCode: 'US',
          safeSearch: 'none'
        })

        // If no results with date filter, try without it
        if (!searchResponse.data.items || searchResponse.data.items.length === 0) {
          console.log(`⚠️ No recent videos for ${channel.name}, trying without date filter...`)
          searchResponse = await youtube.search.list({
            part: ['snippet'],
            channelId: channel.id,
            type: ['video'],
            order: 'date',
            maxResults: videosPerChannel,
            relevanceLanguage: 'en',
            regionCode: 'US',
            safeSearch: 'none'
          })
        }

        if (!searchResponse.data.items || searchResponse.data.items.length === 0) {
          console.log(`❌ No videos found for ${channel.name} even without date filter`)
          continue
        }

        console.log(`✅ Found ${searchResponse.data.items.length} videos for ${channel.name}`)

        // Get video IDs for detailed info
        const videoIds = searchResponse.data.items?.map((item) => item.id?.videoId).filter(Boolean) || []
        
        if (videoIds.length === 0) continue

        // Get video details (duration, view count, etc.)
        const videoDetails = await youtube.videos.list({
          part: ['contentDetails', 'statistics'],
          id: videoIds as string[]
        })

        // Transform to our content format
        const transformedVideos: YouTubeContent[] = (searchResponse.data.items || []).map((item, index: number) => {
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
            channelTitle: snippet.channelTitle || channel.name,
            duration: videoDetail?.contentDetails?.duration || 'Unknown',
            viewCount: parseInt(videoDetail?.statistics?.viewCount || '0'),
            url: `https://www.youtube.com/watch?v=${videoId}`,
            thumbnail: thumbnail,
            creatorName: snippet.channelTitle || channel.name
          }
        }).filter(Boolean) as YouTubeContent[]

        allVideos.push(...transformedVideos)
        console.log(`✅ Added ${transformedVideos.length} videos from ${channel.name}`)

        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        console.error(`❌ Error fetching videos from ${channel.name}:`, error)
        continue
      }
    }

    // Sort by publish date (newest first) and limit results
    const sortedVideos = allVideos
      .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())
      .slice(0, maxResults)

    // Cache the results
    cache.set(cacheKey, sortedVideos)
    
    const duration = Date.now() - startTime

    // Log successful fetch
    logger.contentUpdateSuccess('YouTube Simple API', {
      source: 'youtube',
      count: sortedVideos.length,
      cached: false,
      responseTime: duration,
      items: sortedVideos.slice(0, 5).map(video => ({
        id: video.id,
        title: video.title.substring(0, 100) + (video.title.length > 100 ? '...' : ''),
        publishDate: video.publishDate,
        category: video.category,
        channelTitle: video.channelTitle,
        viewCount: video.viewCount
      }))
    }, {
      ...context,
      duration,
      cached: false,
      maxResults,
      daysBack,
      totalChannels: FANTASY_FOOTBALL_CHANNELS.length
    })

    console.log(`🎥 Successfully fetched ${sortedVideos.length} videos from ${FANTASY_FOOTBALL_CHANNELS.length} channels`)

    return NextResponse.json({
      success: true,
      data: sortedVideos,
      cached: false,
      total: sortedVideos.length,
      channels: FANTASY_FOOTBALL_CHANNELS.length
    } as APIResponse<YouTubeContent[]> & { channels: number })

  } catch (error) {
    logger.error('YouTube Simple API failed', error instanceof Error ? error : new Error('Unknown error'), {
      ...context,
      duration: Date.now() - startTime
    })
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch YouTube videos',
      data: []
    } as APIResponse<YouTubeContent[]>, { status: 500 })
  }
}
