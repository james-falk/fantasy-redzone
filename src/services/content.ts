import { promises as fs } from 'fs'
import path from 'path'
import { Content, Course, YouTubeContent, RSSContent, ContentFilter, APIResponse } from '@/types/content'

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

// Function to get all static courses (disabled - using only YouTube content)
export const getStaticCourses = async (): Promise<Course[]> => {
  // Return empty array - using only real YouTube content now
  return []
}

// Function to fetch YouTube content
export const getYouTubeContent = async (
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
    
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
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
    
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
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
    
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
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

// Function to get all content (static + dynamic)
export const getAllContent = async (options?: {
  includeYouTube?: boolean
  includeRSS?: boolean
  includeSubscriptions?: boolean
  youtubeQuery?: string
  youtubeMaxResults?: number
  rssLimit?: number
  subscriptionsMaxResults?: number
  subscriptionsDaysBack?: number
}): Promise<Content[]> => {
  const {
    includeYouTube = true,
    includeRSS = true,
    includeSubscriptions = true,
    youtubeQuery = 'fantasy football',
    youtubeMaxResults = 15,
    rssLimit = 15,
    subscriptionsMaxResults = 25,
    subscriptionsDaysBack = 7
  } = options || {}

  try {
    // Fetch all content separately to handle different types
    const staticPromise = getStaticCourses()
    const youtubePromise = includeYouTube ? getYouTubeContent(youtubeQuery, youtubeMaxResults) : Promise.resolve([])
    const rssPromise = includeRSS ? getRSSContent(undefined, rssLimit) : Promise.resolve([])
    const subscriptionsPromise = includeSubscriptions ? getYouTubeSubscriptions(subscriptionsMaxResults, subscriptionsDaysBack) : Promise.resolve([])

    const [staticContent, youtubeContent, rssContent, subscriptionContent] = await Promise.all([
      staticPromise,
      youtubePromise,
      rssPromise,
      subscriptionsPromise
    ])
    
    // Combine all content
    const allContent: Content[] = [
      ...staticContent,
      ...youtubeContent,
      ...rssContent,
      ...subscriptionContent
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
    
    // Fallback to static content only
    return await getStaticCourses()
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