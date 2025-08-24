import { IResource } from '@/models/Resource'
import { processResourceData, extractKeywords } from '@/utils/resource-helpers'

export interface YouTubeVideo {
  id: string
  title: string
  description: string
  publishedAt: string
  thumbnails: {
    default?: { url: string; width: number; height: number }
    medium?: { url: string; width: number; height: number }
    high?: { url: string; width: number; height: number }
    standard?: { url: string; width: number; height: number }
    maxres?: { url: string; width: number; height: number }
  }
  channelTitle: string
  channelId: string
  tags?: string[]
  categoryId: string
  defaultLanguage?: string
  defaultAudioLanguage?: string
  duration?: string
  viewCount?: string
  likeCount?: string
  commentCount?: string
}

export interface YouTubeChannel {
  id: string
  title: string
  description: string
  customUrl?: string
  publishedAt: string
  thumbnails: {
    default?: { url: string; width: number; height: number }
    medium?: { url: string; width: number; height: number }
    high?: { url: string; width: number; height: number }
  }
  subscriberCount?: string
  videoCount?: string
  viewCount?: string
}

export interface YouTubeSearchResult {
  items: YouTubeVideo[]
  nextPageToken?: string
  pageInfo: {
    totalResults: number
    resultsPerPage: number
  }
}

export interface YouTubeChannelResult {
  items: YouTubeChannel[]
  pageInfo: {
    totalResults: number
    resultsPerPage: number
  }
}

class YouTubeAPIService {
  private apiKey: string
  private baseUrl = 'https://www.googleapis.com/youtube/v3'

  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY!
    if (!this.apiKey) {
      throw new Error('YOUTUBE_API_KEY environment variable is required')
    }
  }

  /**
   * Fetch recent videos from a YouTube channel
   */
  async getChannelVideos(channelId: string, maxResults: number = 50): Promise<YouTubeVideo[]> {
    try {
      console.log(`Fetching videos from channel: ${channelId}`)
      
      // First, get the channel's uploads playlist ID
      const channelResponse = await fetch(
        `${this.baseUrl}/channels?part=snippet,contentDetails&id=${channelId}&key=${this.apiKey}`
      )
      
      if (!channelResponse.ok) {
        throw new Error(`Failed to fetch channel: ${channelResponse.statusText}`)
      }
      
      const channelData = await channelResponse.json()
      
      if (!channelData.items || channelData.items.length === 0) {
        throw new Error(`Channel not found: ${channelId}`)
      }
      
      const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads
      console.log(`Found uploads playlist: ${uploadsPlaylistId}`)
      
      // Get videos from the uploads playlist
      const playlistResponse = await fetch(
        `${this.baseUrl}/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}&key=${this.apiKey}`
      )
      
      if (!playlistResponse.ok) {
        throw new Error(`Failed to fetch playlist: ${playlistResponse.statusText}`)
      }
      
      const playlistData = await playlistResponse.json()
      
      if (!playlistData.items) {
        console.log('No videos found in playlist')
        return []
      }
      
      // Get detailed video information for each video
      const videoIds = playlistData.items.map((item: Record<string, unknown>) => (item as { contentDetails: { videoId: string } }).contentDetails.videoId).join(',')
      
      const videosResponse = await fetch(
        `${this.baseUrl}/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${this.apiKey}`
      )
      
      if (!videosResponse.ok) {
        throw new Error(`Failed to fetch videos: ${videosResponse.statusText}`)
      }
      
      const videosData = await videosResponse.json()
      
      if (!videosData.items) {
        console.log('No video details found')
        return []
      }
      
      const videos: YouTubeVideo[] = videosData.items.map((item: Record<string, unknown>) => ({
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        publishedAt: item.snippet.publishedAt,
        thumbnails: item.snippet.thumbnails,
        channelTitle: item.snippet.channelTitle,
        channelId: item.snippet.channelId,
        tags: item.snippet.tags || [],
        categoryId: item.snippet.categoryId,
        defaultLanguage: item.snippet.defaultLanguage,
        defaultAudioLanguage: item.snippet.defaultAudioLanguage,
        duration: item.contentDetails?.duration,
        viewCount: item.statistics?.viewCount,
        likeCount: item.statistics?.likeCount,
        commentCount: item.statistics?.commentCount
      }))
      
      console.log(`Successfully fetched ${videos.length} videos from channel ${channelId}`)
      return videos
      
    } catch (error) {
      console.error(`Error fetching videos from channel ${channelId}:`, error)
      throw error
    }
  }

  /**
   * Search for videos by channel username
   */
  async searchChannelVideos(channelUsername: string, maxResults: number = 50): Promise<YouTubeVideo[]> {
    try {
      console.log(`Searching for videos from channel username: ${channelUsername}`)
      
      // First, search for the channel
      const channelSearchResponse = await fetch(
        `${this.baseUrl}/search?part=snippet&q=${encodeURIComponent(channelUsername)}&type=channel&key=${this.apiKey}`
      )
      
      if (!channelSearchResponse.ok) {
        throw new Error(`Failed to search for channel: ${channelSearchResponse.statusText}`)
      }
      
      const channelSearchData = await channelSearchResponse.json()
      
      if (!channelSearchData.items || channelSearchData.items.length === 0) {
        throw new Error(`Channel not found: ${channelUsername}`)
      }
      
      const channelId = channelSearchData.items[0].id.channelId
      console.log(`Found channel ID: ${channelId}`)
      
      // Now get videos from the channel
      return await this.getChannelVideos(channelId, maxResults)
      
    } catch (error) {
      console.error(`Error searching for channel videos ${channelUsername}:`, error)
      throw error
    }
  }

  /**
   * Convert YouTube video to Resource format
   */
  convertVideoToResource(video: YouTubeVideo): Partial<IResource> {
    // Get the best available thumbnail
    const thumbnail = video.thumbnails.maxres?.url || 
                     video.thumbnails.standard?.url || 
                     video.thumbnails.high?.url || 
                     video.thumbnails.medium?.url || 
                     video.thumbnails.default?.url

    const resourceData = {
      title: video.title,
      description: video.description,
      url: `https://www.youtube.com/watch?v=${video.id}`,
      image: thumbnail,
      videoUrl: `https://www.youtube.com/watch?v=${video.id}`,
      source: 'YouTube',
      author: video.channelTitle,
      category: 'Video',
      tags: video.tags || [],
      pubDate: new Date(video.publishedAt),
      rawFeedItem: video
    }

    return processResourceData(resourceData)
  }

  /**
   * Get channel information
   */
  async getChannelInfo(channelId: string): Promise<YouTubeChannel | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/channels?part=snippet,statistics&id=${channelId}&key=${this.apiKey}`
      )
      
      if (!response.ok) {
        throw new Error(`Failed to fetch channel info: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (!data.items || data.items.length === 0) {
        return null
      }
      
      const item = data.items[0]
      return {
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        customUrl: item.snippet.customUrl,
        publishedAt: item.snippet.publishedAt,
        thumbnails: item.snippet.thumbnails,
        subscriberCount: item.statistics?.subscriberCount,
        videoCount: item.statistics?.videoCount,
        viewCount: item.statistics?.viewCount
      }
      
    } catch (error) {
      console.error(`Error fetching channel info for ${channelId}:`, error)
      throw error
    }
  }
}

export default YouTubeAPIService
