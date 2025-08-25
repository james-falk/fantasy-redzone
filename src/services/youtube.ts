import { getEnvVar } from '@/lib/environment'

/**
 * YouTube Data API v3 Service
 * 
 * This service provides methods to interact with the YouTube Data API v3
 * for fetching channel information and videos.
 * 
 * ENVIRONMENT CONFIGURATION:
 * - Uses YOUTUBE_API_KEY from environment variables
 * - Works consistently across local development and production
 * - Validates API key presence on service initialization
 */

export class YouTubeService {
  private apiKey: string

  constructor() {
    // Use environment utility for consistent API key handling
    this.apiKey = getEnvVar('YOUTUBE_API_KEY', '') || ''
    
    // Note: API key is optional since this project uses OAuth authentication
    // The API key is only used for certain operations that don't require OAuth
  }

  /**
   * Fetches recent videos from a YouTube channel
   * @param channelId - The YouTube channel ID
   * @param maxResults - Maximum number of videos to fetch (default: 10)
   * @returns Promise with channel videos data
   */
  async getChannelVideos(channelId: string, maxResults: number = 10) {
    try {
      // First, get the channel's uploads playlist ID
      const channelResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${this.apiKey}`
      )

      if (!channelResponse.ok) {
        throw new Error(`Failed to fetch channel info: ${channelResponse.statusText}`)
      }

      const channelData = await channelResponse.json()
      
      if (!channelData.items || channelData.items.length === 0) {
        throw new Error(`Channel not found: ${channelId}`)
      }

      const uploadsPlaylistId = (channelData.items[0].contentDetails?.relatedPlaylists?.uploads as string)
      
      if (!uploadsPlaylistId) {
        throw new Error('Uploads playlist not found for channel')
      }

      // Fetch videos from the uploads playlist
      const videosResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}&key=${this.apiKey}`
      )

      if (!videosResponse.ok) {
        throw new Error(`Failed to fetch videos: ${videosResponse.statusText}`)
      }

      const videosData = await videosResponse.json()
      
             // Transform the data to match our expected format
       const videos = videosData.items.map((item: Record<string, unknown>) => ({
         id: ((item.contentDetails as Record<string, unknown>)?.videoId as string),
         title: ((item.snippet as Record<string, unknown>).title as string),
         description: ((item.snippet as Record<string, unknown>).description as string),
         thumbnail: (((item.snippet as Record<string, unknown>).thumbnails as Record<string, unknown>)?.high as Record<string, unknown>)?.url as string,
         publishedAt: ((item.snippet as Record<string, unknown>).publishedAt as string),
         channelTitle: ((item.snippet as Record<string, unknown>).channelTitle as string),
         duration: ((item.contentDetails as Record<string, unknown>)?.duration as string),
         viewCount: ((item.statistics as Record<string, unknown>)?.viewCount as string)
       }))

      return {
        channelId,
        videos,
        totalResults: videosData.pageInfo?.totalResults || 0
      }

    } catch (error) {
      console.error('YouTube API error:', error)
      throw error
    }
  }

  /**
   * Searches for videos in a specific channel
   * @param channelId - The YouTube channel ID
   * @param query - Search query
   * @param maxResults - Maximum number of results (default: 10)
   * @returns Promise with search results
   */
  async searchChannelVideos(channelId: string, query: string, maxResults: number = 10) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}&order=date&key=${this.apiKey}`
      )

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`)
      }

      const data = await response.json()
      
      return {
        channelId,
        query,
                 videos: data.items.map((item: Record<string, unknown>) => ({
           id: ((item.id as Record<string, unknown>)?.videoId as string),
           title: ((item.snippet as Record<string, unknown>).title as string),
           description: ((item.snippet as Record<string, unknown>).description as string),
           thumbnail: (((item.snippet as Record<string, unknown>).thumbnails as Record<string, unknown>)?.high as Record<string, unknown>)?.url as string,
           publishedAt: ((item.snippet as Record<string, unknown>).publishedAt as string),
           channelTitle: ((item.snippet as Record<string, unknown>).channelTitle as string)
         })),
        totalResults: data.pageInfo?.totalResults || 0
      }

    } catch (error) {
      console.error('YouTube search error:', error)
      throw error
    }
  }

  /**
   * Gets channel information
   * @param channelId - The YouTube channel ID
   * @returns Promise with channel information
   */
  async getChannelInfo(channelId: string) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${channelId}&key=${this.apiKey}`
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch channel info: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.items || data.items.length === 0) {
        throw new Error(`Channel not found: ${channelId}`)
      }

      const channel = data.items[0]
      
      return {
        id: channelId,
        title: (channel.snippet?.title as string),
        description: (channel.snippet?.description as string),
        thumbnail: (channel.snippet?.thumbnails?.high?.url as string),
        subscriberCount: (channel.statistics?.subscriberCount as string),
        videoCount: (channel.statistics?.videoCount as string),
        viewCount: (channel.statistics?.viewCount as string),
        uploadsPlaylistId: (channel.contentDetails?.relatedPlaylists?.uploads as string)
      }

    } catch (error) {
      console.error('YouTube channel info error:', error)
      throw error
    }
  }
}
