import { connectToDatabase } from '@/lib/mongodb'
import Resource from '@/models/Resource'
import { YouTubeService } from './youtube'
import FeedSourceManager, { FeedSourceConfig } from './feed-source-manager'

export interface IngestionResult {
  success: boolean
  totalVideos: number
  newVideos: number
  updatedVideos: number
  skippedVideos: number
  errors: string[]
  sources: {
    sourceId: string
    sourceName: string
    videosFound: number
    videosProcessed: number
    success: boolean
    error?: string
    duration: number
  }[]
}

export interface ChannelConfig {
  id: string
  name: string
  maxResults?: number
}

class YouTubeIngestionService {
  private youtubeService: YouTubeService
  private feedSourceManager: FeedSourceManager

  constructor() {
    this.youtubeService = new YouTubeService()
    this.feedSourceManager = new FeedSourceManager()
  }

  /**
   * Ingest videos from all enabled YouTube sources in the database
   */
  async ingestFromAllSources(): Promise<IngestionResult> {
    const result: IngestionResult = {
      success: true,
      totalVideos: 0,
      newVideos: 0,
      updatedVideos: 0,
      skippedVideos: 0,
      errors: [],
      sources: []
    }

    console.log('Starting YouTube ingestion from all enabled sources...')

    try {
      // Get all enabled YouTube sources
      const sources = await this.feedSourceManager.getEnabledSources('youtube')
      
      if (sources.length === 0) {
        console.log('No enabled YouTube sources found')
        return result
      }

      console.log(`Found ${sources.length} enabled YouTube sources`)

      // Process each source
      for (const source of sources) {
        const startTime = Date.now()
        const sourceResult = {
          sourceId: source.id,
          sourceName: source.name,
          videosFound: 0,
          videosProcessed: 0,
          success: true,
          error: undefined as string | undefined,
          duration: 0
        }

        try {
          console.log(`Processing source: ${source.name} (${source.identifier})`)

          // Fetch videos from the channel
          const videosResult = await this.youtubeService.getChannelVideos(
            source.identifier,
            source.maxResults || 10
          )

          sourceResult.videosFound = videosResult.videos.length
          console.log(`Found ${videosResult.videos.length} videos from ${source.name}`)

          // Process each video
          for (const video of videosResult.videos) {
            try {
              const videoResult = await this.processVideo(video)
              
              if (videoResult.status === 'new') {
                result.newVideos++
              } else if (videoResult.status === 'updated') {
                result.updatedVideos++
              } else {
                result.skippedVideos++
              }
              
              sourceResult.videosProcessed++
              result.totalVideos++
              
            } catch (error) {
              const errorMsg = `Error processing video ${video.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
              console.error(errorMsg)
              result.errors.push(errorMsg)
            }
          }

          // Update ingestion status
          await this.feedSourceManager.updateIngestionStatus(
            source.id,
            true,
            sourceResult.videosProcessed
          )

        } catch (error) {
          const errorMsg = `Error processing source ${source.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
          console.error(errorMsg)
          sourceResult.success = false
          sourceResult.error = errorMsg
          result.errors.push(errorMsg)

          // Update ingestion status with error
          await this.feedSourceManager.updateIngestionStatus(
            source.id,
            false,
            0,
            errorMsg
          )
        }

        sourceResult.duration = Date.now() - startTime
        result.sources.push(sourceResult)
      }

      console.log(`Ingestion completed. Total videos: ${result.totalVideos}, New: ${result.newVideos}, Updated: ${result.updatedVideos}, Skipped: ${result.skippedVideos}`)
      
      if (result.errors.length > 0) {
        result.success = false
        console.error(`Ingestion completed with ${result.errors.length} errors`)
      }

    } catch (error) {
      const errorMsg = `Database connection error: ${error instanceof Error ? error.message : 'Unknown error'}`
      console.error(errorMsg)
      result.success = false
      result.errors.push(errorMsg)
    }

    return result
  }

  /**
   * Ingest videos from specific sources by ID
   */
  async ingestFromSourceIds(sourceIds: string[]): Promise<IngestionResult> {
    const result: IngestionResult = {
      success: true,
      totalVideos: 0,
      newVideos: 0,
      updatedVideos: 0,
      skippedVideos: 0,
      errors: [],
      sources: []
    }

    console.log(`Starting YouTube ingestion from ${sourceIds.length} specific sources...`)

    try {
      for (const sourceId of sourceIds) {
        const source = await this.feedSourceManager.getSourceById(sourceId)
        
        if (!source) {
          const errorMsg = `Source with ID ${sourceId} not found`
          result.errors.push(errorMsg)
          continue
        }

        if (source.type !== 'youtube') {
          const errorMsg = `Source ${source.name} is not a YouTube source`
          result.errors.push(errorMsg)
          continue
        }

        if (!source.enabled) {
          const errorMsg = `Source ${source.name} is disabled`
          result.errors.push(errorMsg)
          continue
        }

        const startTime = Date.now()
        const sourceResult = {
          sourceId: source.id,
          sourceName: source.name,
          videosFound: 0,
          videosProcessed: 0,
          success: true,
          error: undefined as string | undefined,
          duration: 0
        }

        try {
          console.log(`Processing source: ${source.name} (${source.identifier})`)

          const videosResult = await this.youtubeService.getChannelVideos(
            source.identifier,
            source.maxResults || 10
          )

          sourceResult.videosFound = videosResult.videos.length

          for (const video of videosResult.videos) {
            try {
              const videoResult = await this.processVideo(video)
              
              if (videoResult.status === 'new') {
                result.newVideos++
              } else if (videoResult.status === 'updated') {
                result.updatedVideos++
              } else {
                result.skippedVideos++
              }
              
              sourceResult.videosProcessed++
              result.totalVideos++
              
            } catch (error) {
              const errorMsg = `Error processing video ${video.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
              console.error(errorMsg)
              result.errors.push(errorMsg)
            }
          }

          await this.feedSourceManager.updateIngestionStatus(
            source.id,
            true,
            sourceResult.videosProcessed
          )

        } catch (error) {
          const errorMsg = `Error processing source ${source.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
          console.error(errorMsg)
          sourceResult.success = false
          sourceResult.error = errorMsg
          result.errors.push(errorMsg)

          await this.feedSourceManager.updateIngestionStatus(
            source.id,
            false,
            0,
            errorMsg
          )
        }

        sourceResult.duration = Date.now() - startTime
        result.sources.push(sourceResult)
      }

      if (result.errors.length > 0) {
        result.success = false
      }

    } catch (error) {
      const errorMsg = `Database connection error: ${error instanceof Error ? error.message : 'Unknown error'}`
      console.error(errorMsg)
      result.success = false
      result.errors.push(errorMsg)
    }

    return result
  }

  /**
   * Ingest videos from sources that need ingestion (haven't been ingested recently or have errors)
   */
  async ingestFromSourcesNeedingIngestion(hoursThreshold: number = 24): Promise<IngestionResult> {
    console.log(`Starting YouTube ingestion from sources needing ingestion (threshold: ${hoursThreshold} hours)...`)
    
    const sources = await this.feedSourceManager.getSourcesNeedingIngestion(hoursThreshold)
    const youtubeSources = sources.filter(s => s.type === 'youtube')
    
    if (youtubeSources.length === 0) {
      console.log('No YouTube sources need ingestion')
      return {
        success: true,
        totalVideos: 0,
        newVideos: 0,
        updatedVideos: 0,
        skippedVideos: 0,
        errors: [],
        sources: []
      }
    }

    const sourceIds = youtubeSources.map(s => s.id)
    return await this.ingestFromSourceIds(sourceIds)
  }

  /**
   * Legacy method for backward compatibility
   */
  async ingestFromChannels(channels: ChannelConfig[]): Promise<IngestionResult> {
    console.log('Using legacy ingestFromChannels method. Consider using ingestFromAllSources instead.')
    
    const result: IngestionResult = {
      success: true,
      totalVideos: 0,
      newVideos: 0,
      updatedVideos: 0,
      skippedVideos: 0,
      errors: [],
      sources: []
    }

    try {
      await connectToDatabase()

      for (const channel of channels) {
        const startTime = Date.now()
        const sourceResult = {
          sourceId: channel.id,
          sourceName: channel.name,
          videosFound: 0,
          videosProcessed: 0,
          success: true,
          error: undefined as string | undefined,
          duration: 0
        }

        try {
          const videosResult = await this.youtubeService.getChannelVideos(
            channel.id, 
            channel.maxResults || 50
          )

          sourceResult.videosFound = videosResult.videos.length

          for (const video of videosResult.videos) {
            try {
              const videoResult = await this.processVideo(video)
              
              if (videoResult.status === 'new') {
                result.newVideos++
              } else if (videoResult.status === 'updated') {
                result.updatedVideos++
              } else {
                result.skippedVideos++
              }
              
              sourceResult.videosProcessed++
              result.totalVideos++
              
            } catch (error) {
              const errorMsg = `Error processing video ${video.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
              console.error(errorMsg)
              result.errors.push(errorMsg)
            }
          }

        } catch (error) {
          const errorMsg = `Error processing channel ${channel.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
          console.error(errorMsg)
          sourceResult.success = false
          sourceResult.error = errorMsg
          result.errors.push(errorMsg)
        }

        sourceResult.duration = Date.now() - startTime
        result.sources.push(sourceResult)
      }

      if (result.errors.length > 0) {
        result.success = false
      }

    } catch (error) {
      const errorMsg = `Database connection error: ${error instanceof Error ? error.message : 'Unknown error'}`
      console.error(errorMsg)
      result.success = false
      result.errors.push(errorMsg)
    }

    return result
  }

  /**
   * Process a single video
   */
  private async processVideo(video: { id: string; title: string; description: string; thumbnail: string; channelTitle: string; publishedAt: string }): Promise<{ status: 'new' | 'updated' | 'skipped' }> {
    try {
      // Convert video to resource format
      const resourceData = {
        title: video.title,
        description: video.description,
        url: `https://www.youtube.com/watch?v=${video.id}`,
        image: video.thumbnail,
        videoUrl: `https://www.youtube.com/watch?v=${video.id}`,
        source: 'YouTube',
        author: video.channelTitle,
        category: 'Video',
        tags: [],
        pubDate: new Date(video.publishedAt),
        rawFeedItem: video
      }
      
      // Check if video already exists
      const existingResource = await Resource.findOne({ url: resourceData.url })
      
      if (existingResource) {
        // Update existing resource with new data
        const updatedResource = await Resource.findByIdAndUpdate(
          existingResource._id,
          {
            ...resourceData,
            updatedAt: new Date()
          },
          { new: true, runValidators: true }
        )
        
        if (updatedResource) {
          console.log(`Updated video: ${video.title}`)
          return { status: 'updated' }
        } else {
          console.log(`Failed to update video: ${video.title}`)
          return { status: 'skipped' }
        }
      } else {
        // Create new resource
        const newResource = new Resource(resourceData)
        await newResource.save()
        
        console.log(`Added new video: ${video.title}`)
        return { status: 'new' }
      }
      
    } catch (error) {
      console.error(`Error processing video ${video.id}:`, error)
      throw error
    }
  }

  /**
   * Legacy methods for backward compatibility
   */
  async ingestFromChannel(channelId: string, channelName?: string, maxResults: number = 50): Promise<IngestionResult> {
    return await this.ingestFromChannels([{
      id: channelId,
      name: channelName || channelId,
      maxResults
    }])
  }

  async ingestFromChannelUsername(username: string, maxResults: number = 50): Promise<IngestionResult> {
    try {
      console.log(`Searching for channel by username: ${username}`)
      
      const videosResult = await this.youtubeService.searchChannelVideos(username, maxResults.toString())
      
      if (videosResult.videos.length === 0) {
        return {
          success: false,
          totalVideos: 0,
          newVideos: 0,
          updatedVideos: 0,
          skippedVideos: 0,
          errors: [`No videos found for channel username: ${username}`],
          sources: []
        }
      }
      
      const channelId = videosResult.channelId
      const channelName = videosResult.videos[0].channelTitle
      
      return await this.ingestFromChannel(channelId, channelName, maxResults)
      
    } catch (error) {
      const errorMsg = `Error ingesting from channel username ${username}: ${error instanceof Error ? error.message : 'Unknown error'}`
      console.error(errorMsg)
      
      return {
        success: false,
        totalVideos: 0,
        newVideos: 0,
        updatedVideos: 0,
        skippedVideos: 0,
        errors: [errorMsg],
        sources: []
      }
    }
  }

  /**
   * Get ingestion statistics
   */
  async getIngestionStats(): Promise<{
    totalResources: number
    youtubeResources: number
    channels: string[]
    latestIngestion: Date | null
    feedSourceStats: {
      totalSources: number
      enabledSources: number
      youtubeSources: number
      rssSources: number
      sourcesByCategory: Record<string, number>
      recentErrors: number
      lastIngestion: Date | null
    }
  }> {
    try {
      await connectToDatabase()
      
      const totalResources = await Resource.countDocuments({})
      const youtubeResources = await Resource.countDocuments({ source: 'YouTube' })
      const channels = await Resource.distinct('author', { source: 'YouTube' })
      
      const latestResource = await Resource.findOne(
        { source: 'YouTube' },
        { fetchedAt: 1 },
        { sort: { fetchedAt: -1 } }
      )
      
      const feedSourceStats = await this.feedSourceManager.getIngestionStats()
      
      return {
        totalResources,
        youtubeResources,
        channels,
        latestIngestion: latestResource?.fetchedAt || null,
        feedSourceStats
      }
      
    } catch (error) {
      console.error('Error getting ingestion stats:', error)
      throw error
    }
  }
}

export default YouTubeIngestionService
