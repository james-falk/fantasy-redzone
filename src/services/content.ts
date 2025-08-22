import { promises as fs } from 'fs'
import path from 'path'
import { Content, Course, YouTubeContent, RSSContent, ContentFilter, APIResponse } from '@/types/content'
import { NewsArticle } from '@/types/news'

// Cache for static content
let staticContentCache: Course[] | null = null

// Function to read a static course file and convert to new format
const readCourseFile = async (filePath: string): Promise<Course> => {
  const fileData = await fs.readFile(filePath, 'utf8')
  const courseData = JSON.parse(fileData)
  
  // Convert old format to new unified format
  return {
    id: `static_${courseData.slug}`,
    title: courseData.title,
    shortDescription: courseData.shortDescription,
    cover: courseData.cover,
    slug: courseData.slug,
    category: courseData.category,
    publishDate: courseData.publishDate,
    source: 'static' as const,
    tags: courseData.tags || [], // Read tags from JSON file
    duration: courseData.duration,
    features: courseData.features || []
  }
}

// Function to clear the static content cache (useful for development)
export const clearStaticContentCache = () => {
  staticContentCache = null
}

// Function to get all static courses (emergency fallback content)
export const getStaticCourses = async (): Promise<Course[]> => {
  // Emergency fallback content to ensure site never shows empty
  return [
    {
      id: 'static_emergency_1',
      title: 'Fantasy Football Weekly Rankings & Analysis',
      shortDescription: 'Get the latest fantasy football rankings, start/sit advice, and player analysis to dominate your leagues.',
      cover: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&h=300&fit=crop&q=80&auto=format',
      slug: 'fantasy-football-weekly-rankings',
      category: 'Rankings',
      publishDate: new Date().toISOString(),
      source: 'static' as const,
      tags: ['Rankings', 'Analysis', 'Weekly'],
      duration: '15 min read',
      features: ['Player Rankings', 'Start/Sit Advice', 'Matchup Analysis']
    },
    {
      id: 'static_emergency_2',
      title: 'Waiver Wire Pickups & Sleeper Players',
      shortDescription: 'Discover the best waiver wire additions and sleeper picks that could win your fantasy football league.',
      cover: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=400&h=300&fit=crop&q=80&auto=format',
      slug: 'waiver-wire-pickups-sleepers',
      category: 'Waiver Wire',
      publishDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      source: 'static' as const,
      tags: ['Waiver Wire', 'Sleepers', 'Pickups'],
      duration: '10 min read',
      features: ['Weekly Pickups', 'Sleeper Analysis', 'Drop Candidates']
    }
  ]
}

// Function to fetch YouTube content using simple API key approach (recommended)
export const getYouTubeContent = async (
  maxResults: number = 30,
  daysBack: number = 7
): Promise<YouTubeContent[]> => {
  try {
    const params = new URLSearchParams({
      maxResults: maxResults.toString(),
      daysBack: daysBack.toString()
    })
    
    // Build the correct base URL for the current environment
    const baseUrl = typeof window !== 'undefined' 
      ? '' // Client-side: use relative URLs
      : process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` // Vercel production/preview
        : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000' // Fallback
    
    console.log('🔍 Content Service Debug:', { 
      isClient: typeof window !== 'undefined',
      VERCEL_URL: process.env.VERCEL_URL,
      baseUrl,
      fullUrl: `${baseUrl}/api/youtube-simple?${params}`
    })
    
    const response = await fetch(`${baseUrl}/api/youtube-simple?${params}`)
    
    if (!response.ok) {
      console.error('YouTube Simple API HTTP Error:', response.status, response.statusText)
      console.error('Request URL:', `${baseUrl}/api/youtube-simple?${params}`)
      console.error('Environment:', { 
        VERCEL_URL: process.env.VERCEL_URL, 
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
        isClient: typeof window !== 'undefined'
      })
      return []
    }
    
    const result: APIResponse<YouTubeContent[]> = await response.json()
    
    if (result.success && result.data) {
      console.log('✅ YouTube Simple API Success:', {
        totalVideos: result.data.length,
        firstVideo: result.data[0]?.title,
        requestUrl: `${baseUrl}/api/youtube-simple?${params}`
      })
      return result.data
    }
    
    console.error('YouTube Simple API Error:', result.error)
    if ('instructions' in result && result.instructions) {
      console.log('📝 YouTube Setup Instructions:', result.instructions)
    }
    
    // If quota exceeded, try fallback content
    if (result.error?.includes('quota')) {
      console.log('🔄 Quota exceeded, attempting to serve fallback content...')
      try {
        const fallbackResponse = await fetch(`${baseUrl}/api/youtube-quota-fallback`)
        if (fallbackResponse.ok) {
          const fallbackResult = await fallbackResponse.json()
          if (fallbackResult.success && fallbackResult.data) {
            console.log('✅ Serving fallback YouTube content due to quota limits')
            return fallbackResult.data
          }
        }
      } catch (fallbackError) {
        console.error('Failed to fetch fallback content:', fallbackError)
      }
    }
    
    return []
  } catch (error) {
    console.error('Error fetching YouTube content:', error)
    return []
  }
}

// Legacy function for backward compatibility
export const getYouTubeContentLegacy = async (
  query: string = 'fantasy football',
  maxResults: number = 20,
  channelId?: string
): Promise<YouTubeContent[]> => {
  try {
    const params = new URLSearchParams({
      q: query,
      maxResults: maxResults.toString(),
      ...(channelId && { channelId })
    })
    
    // Build the correct base URL for the current environment
    const baseUrl = typeof window !== 'undefined' 
      ? '' // Client-side: use relative URLs
      : process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` // Vercel production/preview
        : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000' // Fallback
    
    console.log('🔍 Content Service Debug:', { 
      isClient: typeof window !== 'undefined',
      VERCEL_URL: process.env.VERCEL_URL,
      baseUrl,
      fullUrl: `${baseUrl}/api/youtube-simple?${params}`
    })
    
    const response = await fetch(`${baseUrl}/api/youtube?${params}`)
    
    if (!response.ok) {
      console.error('YouTube API HTTP Error:', response.status, response.statusText)
      return []
    }
    
    const result: APIResponse<YouTubeContent[]> = await response.json()
    
    if (result.success && result.data) {
      return result.data
    }
    
    console.error('YouTube API Error:', result.error)
    return []
  } catch (error) {
    console.error('Error fetching YouTube content:', error)
    return []
  }
}

// Function to fetch RSS content
export const getRSSContent = async (
  feedUrl?: string,
  limit: number = 20
): Promise<RSSContent[]> => {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      ...(feedUrl && { url: feedUrl })
    })
    
    // Build the correct base URL for the current environment
    const baseUrl = typeof window !== 'undefined' 
      ? '' // Client-side: use relative URLs
      : process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` // Vercel production/preview
        : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000' // Fallback
    
    console.log('🔍 Content Service Debug:', { 
      isClient: typeof window !== 'undefined',
      VERCEL_URL: process.env.VERCEL_URL,
      baseUrl,
      fullUrl: `${baseUrl}/api/youtube-simple?${params}`
    })
    
    const response = await fetch(`${baseUrl}/api/rss?${params}`)
    
    if (!response.ok) {
      console.error('RSS API HTTP Error:', response.status, response.statusText)
      return []
    }
    
    const result: APIResponse<RSSContent[]> = await response.json()
    
    if (result.success && result.data) {
      return result.data
    }
    
    console.error('RSS API Error:', result.error)
    return []
  } catch (error) {
    console.error('Error fetching RSS content:', error)
    return []
  }
}

// Function to fetch YouTube subscription content
export const getYouTubeSubscriptions = async (
  maxResults: number = 20,
  daysBack: number = 7
): Promise<YouTubeContent[]> => {
  try {
    const params = new URLSearchParams({
      maxResults: maxResults.toString(),
      daysBack: daysBack.toString()
    })
    
    // Build the correct base URL for the current environment
    const baseUrl = typeof window !== 'undefined' 
      ? '' // Client-side: use relative URLs
      : process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` // Vercel production/preview
        : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000' // Fallback
    
    console.log('🔍 Content Service Debug:', { 
      isClient: typeof window !== 'undefined',
      VERCEL_URL: process.env.VERCEL_URL,
      baseUrl,
      fullUrl: `${baseUrl}/api/youtube-simple?${params}`
    })
    
    const response = await fetch(`${baseUrl}/api/youtube/subscriptions?${params}`)
    
    if (!response.ok) {
      console.error('YouTube Subscriptions HTTP Error:', response.status, response.statusText)
      return []
    }
    
    const result: APIResponse<YouTubeContent[]> = await response.json()

    if (result.success && result.data) {
      return result.data
    }
    
    console.error('YouTube Subscriptions API Error:', result.error)
    return []
  } catch (error) {
    console.error('Error fetching YouTube subscriptions:', error)
    return []
  }
}

// Function to fetch news content
export const getNewsContent = async (
  limit: number = 20,
  sourceId?: string
): Promise<NewsArticle[]> => {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      ...(sourceId && { source: sourceId })
    })
    
    // Build the correct base URL for the current environment
    const baseUrl = typeof window !== 'undefined' 
      ? '' // Client-side: use relative URLs
      : process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` // Vercel production/preview
        : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000' // Fallback
    
    console.log('🔍 Content Service Debug:', { 
      isClient: typeof window !== 'undefined',
      VERCEL_URL: process.env.VERCEL_URL,
      baseUrl,
      fullUrl: `${baseUrl}/api/youtube-simple?${params}`
    })
    
    const response = await fetch(`${baseUrl}/api/news?${params}`)
    
    if (!response.ok) {
      console.error('News API HTTP Error:', response.status, response.statusText)
      return []
    }
    
    const result: APIResponse<NewsArticle[]> = await response.json()
    
    if (result.success && result.data) {
      return result.data
    }
    
    console.error('News API Error:', result.error)
    return []
  } catch (error) {
    console.error('Error fetching news content:', error)
    return []
  }
}

// Function to get all content (static + dynamic)
export const getAllContent = async (options?: {
  includeYouTube?: boolean
  includeRSS?: boolean
  includeSubscriptions?: boolean
  includeNews?: boolean
  youtubeQuery?: string
  youtubeMaxResults?: number
  rssLimit?: number
  subscriptionsMaxResults?: number
  subscriptionsDaysBack?: number
  newsLimit?: number
}): Promise<Content[]> => {
  const {
    includeYouTube = true,
    includeRSS = true,
    includeSubscriptions = true,
    includeNews = true,
    youtubeQuery = 'fantasy football',
    youtubeMaxResults = 15,
    rssLimit = 15,
    subscriptionsMaxResults = 25,
    subscriptionsDaysBack = 7,
    newsLimit = 15
  } = options || {}

  try {
    // Fetch all content separately to handle different types
    const staticPromise = getStaticCourses()
    const youtubePromise = includeYouTube ? getYouTubeContent(youtubeMaxResults, subscriptionsDaysBack) : Promise.resolve([])
    const rssPromise = includeRSS ? getRSSContent(undefined, rssLimit) : Promise.resolve([])
    const subscriptionsPromise = Promise.resolve([]) // OAuth subscriptions disabled - using API key approach
    const newsPromise = includeNews ? getNewsContent(newsLimit) : Promise.resolve([])

    const [staticContent, youtubeContent, rssContent, subscriptionContent, newsContent] = await Promise.all([
      staticPromise,
      youtubePromise,
      rssPromise,
      subscriptionsPromise,
      newsPromise
    ])
    
    // Combine all content
    const allContent: Content[] = [
      ...staticContent,
      ...youtubeContent,
      ...rssContent,
      ...subscriptionContent,
      ...newsContent
    ]

    // Remove duplicates (in case same video appears in both YouTube search and subscriptions)
    const uniqueContent = allContent.filter((item, index, self) => 
      index === self.findIndex(t => t.id === item.id)
    )

    // Sort by publish date (newest first)
    return uniqueContent.sort((a, b) => 
      new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
    )
  } catch (error) {
    console.error('Error fetching all content:', error)
    
    // Fallback to static content + emergency content
    const staticContent = await getStaticCourses()
    const emergencyContent = [
      {
        id: 'emergency_youtube_1',
        title: 'Fantasy Football Week 1 Rankings - Top Picks & Sleepers',
        shortDescription: 'Get ready for Week 1 with our top fantasy football rankings, sleeper picks, and must-start players.',
        cover: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&h=300&fit=crop&q=80&auto=format',
        slug: 'fantasy-football-week-1-rankings-emergency',
        category: 'Rankings',
        publishDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        source: 'youtube' as const,
        tags: ['Rankings', 'PPR', 'Start/Sit'],
        videoId: 'emergency_1',
        channelTitle: 'Fantasy Football Today',
        duration: 'PT15M30S',
        viewCount: 125000,
        url: 'https://youtube.com/watch?v=emergency1',
        thumbnail: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&h=300&fit=crop&q=80&auto=format',
        creatorName: 'Fantasy Football Today'
      },
      {
        id: 'emergency_rss_1',
        title: 'NFL Trade Deadline: Impact on Fantasy Football',
        shortDescription: 'Analysis of recent NFL trades and how they affect fantasy football player values and rankings.',
        cover: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=400&h=300&fit=crop&q=80&auto=format',
        slug: 'nfl-trade-deadline-fantasy-impact',
        category: 'News',
        publishDate: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        source: 'rss' as const,
        tags: ['News', 'Trades', 'Analysis'],
        author: 'ESPN Fantasy',
        url: 'https://espn.com/fantasy/football/story/_/id/emergency',
        content: 'Emergency fallback content',
        pubDate: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        sourceName: 'ESPN Fantasy'
      }
    ]
    
    return [...staticContent, ...emergencyContent]
  }
}

// Function to filter content
export const filterContent = (content: Content[], filter: ContentFilter): Content[] => {
  return content.filter(item => {
    // Filter by category
    if (filter.category && item.category !== filter.category) {
      return false
    }
    
    // Filter by source
    if (filter.source && item.source !== filter.source) {
      return false
    }
    
    // Filter by tags
    if (filter.tags && filter.tags.length > 0) {
      const hasTag = filter.tags.some(tag => item.tags.includes(tag))
      if (!hasTag) return false
    }
    
    // Filter by league type
    if (filter.leagueType) {
      const leagueTypeLower = filter.leagueType.toLowerCase()
      const hasLeagueType = item.tags.some(tag => tag.toLowerCase() === leagueTypeLower) ||
                           item.title.toLowerCase().includes(leagueTypeLower) ||
                           item.shortDescription.toLowerCase().includes(leagueTypeLower)
      if (!hasLeagueType) return false
    }
    
    // Filter by search term
    if (filter.search) {
      const searchLower = filter.search.toLowerCase()
      const titleMatch = item.title.toLowerCase().includes(searchLower)
      const descMatch = item.shortDescription.toLowerCase().includes(searchLower)
      if (!titleMatch && !descMatch) return false
    }
    
    return true
  })
}

// Function to get content by slug
export const getContentBySlug = async (slug: string): Promise<Content | null> => {
  try {
    const allContent = await getAllContent()
    return allContent.find(item => item.slug === slug) || null
  } catch (error) {
    console.error('Error fetching content by slug:', error)
    return null
  }
}

// Function to get content categories
export const getContentCategories = async (): Promise<string[]> => {
  try {
    const allContent = await getAllContent()
    const categories = [...new Set(allContent.map(item => item.category))]
    return categories.sort()
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

// Function to get popular content (by view count for YouTube, recent for others)
export const getPopularContent = async (limit: number = 10): Promise<Content[]> => {
  try {
    const allContent = await getAllContent()
    
    // Sort YouTube content by view count, others by date
    const sorted = allContent.sort((a, b) => {
      if (a.source === 'youtube' && b.source === 'youtube') {
        return (b as YouTubeContent).viewCount - (a as YouTubeContent).viewCount
      }
      return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
    })
    
    return sorted.slice(0, limit)
  } catch (error) {
    console.error('Error fetching popular content:', error)
    return []
  }
} 