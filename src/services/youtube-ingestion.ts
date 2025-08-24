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

/**
 * Logs ingestion operations with detailed information
 */
function logIngestionOperation(operation: string, details: {
  sourceType: string
  sourceName?: string
  itemsFound?: number
  itemsProcessed?: number
  newItems?: number
  updatedItems?: number
  skippedItems?: number
  duration?: number
  success?: boolean
  error?: string
}) {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    operation,
    ...details
  }
  
  console.log(`📊 [INGESTION] ${operation}:`, JSON.stringify(logEntry, null, 2))
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
    const startTime = Date.now()
    const result: IngestionResult = {
      success: true,
      totalVideos: 0,
      newVideos: 0,
      updatedVideos: 0,
      skippedVideos: 0,
      errors: [],
      sources: []
    }

    logIngestionOperation('START_INGESTION', {
      sourceType: 'YouTube'
    })

    try {
      // Get all enabled YouTube sources
      const sources = await this.feedSourceManager.getEnabledSources('youtube')
      
      if (sources.length === 0) {
        logIngestionOperation('NO_SOURCES_FOUND', {
          sourceType: 'YouTube',
          itemsFound: 0
        })
        return result
      }

      logIngestionOperation('SOURCES_FOUND', {
        sourceType: 'YouTube',
        itemsFound: sources.length
      })

      // Process each source
      for (const source of sources) {
        const sourceStartTime = Date.now()
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
          logIngestionOperation('PROCESSING_SOURCE', {
            sourceType: 'YouTube',
            sourceName: source.name,
            itemsFound: 0
          })

          // Fetch videos from the channel
          const videosResult = await this.youtubeService.getChannelVideos(
            source.identifier,
            source.maxResults || 10
          )

          sourceResult.videosFound = videosResult.videos.length
          
          logIngestionOperation('VIDEOS_FETCHED', {
            sourceType: 'YouTube',
            sourceName: source.name,
            itemsFound: videosResult.videos.length
          })

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

          sourceResult.duration = Date.now() - sourceStartTime
          
          logIngestionOperation('SOURCE_COMPLETED', {
            sourceType: 'YouTube',
            sourceName: source.name,
            itemsFound: sourceResult.videosFound,
            itemsProcessed: sourceResult.videosProcessed,
            newItems: result.newVideos,
            updatedItems: result.updatedVideos,
            skippedItems: result.skippedVideos,
            duration: sourceResult.duration,
            success: true
          })

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

          sourceResult.duration = Date.now() - sourceStartTime
          
          logIngestionOperation('SOURCE_FAILED', {
            sourceType: 'YouTube',
            sourceName: source.name,
            duration: sourceResult.duration,
            success: false,
            error: errorMsg
          })
        }

        result.sources.push(sourceResult)
      }

      const totalDuration = Date.now() - startTime
      
      if (result.errors.length > 0) {
        result.success = false
        logIngestionOperation('INGESTION_COMPLETED_WITH_ERRORS', {
          sourceType: 'YouTube',
          itemsFound: result.totalVideos,
          newItems: result.newVideos,
          updatedItems: result.updatedVideos,
          skippedItems: result.skippedVideos,
          duration: totalDuration,
          success: false,
          error: `${result.errors.length} errors occurred`
        })
      } else {
        logIngestionOperation('INGESTION_COMPLETED_SUCCESSFULLY', {
          sourceType: 'YouTube',
          itemsFound: result.totalVideos,
          newItems: result.newVideos,
          updatedItems: result.updatedVideos,
          skippedItems: result.skippedVideos,
          duration: totalDuration,
          success: true
        })
      }

    } catch (error) {
      const errorMsg = `Database connection error: ${error instanceof Error ? error.message : 'Unknown error'}`
      console.error(errorMsg)
      result.success = false
      result.errors.push(errorMsg)
      
      logIngestionOperation('INGESTION_FAILED', {
        sourceType: 'YouTube',
        duration: Date.now() - startTime,
        success: false,
        error: errorMsg
      })
    }

    return result
  }

  /**
   * Ingest videos from specific sources by ID
   */
  async ingestFromSourceIds(sourceIds: string[]): Promise<IngestionResult> {
    const startTime = Date.now()
    const result: IngestionResult = {
      success: true,
      totalVideos: 0,
      newVideos: 0,
      updatedVideos: 0,
      skippedVideos: 0,
      errors: [],
      sources: []
    }

    logIngestionOperation('START_SOURCE_INGESTION', {
      sourceType: 'YouTube',
      itemsFound: sourceIds.length
    })

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

        const sourceStartTime = Date.now()
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
          logIngestionOperation('PROCESSING_SOURCE_BY_ID', {
            sourceType: 'YouTube',
            sourceName: source.name,
            itemsFound: 0
          })

          const videosResult = await this.youtubeService.getChannelVideos(
            source.identifier,
            source.maxResults || 10
          )

          sourceResult.videosFound = videosResult.videos.length

          logIngestionOperation('VIDEOS_FETCHED_BY_ID', {
            sourceType: 'YouTube',
            sourceName: source.name,
            itemsFound: videosResult.videos.length
          })

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

          sourceResult.duration = Date.now() - sourceStartTime
          
          logIngestionOperation('SOURCE_BY_ID_COMPLETED', {
            sourceType: 'YouTube',
            sourceName: source.name,
            itemsFound: sourceResult.videosFound,
            itemsProcessed: sourceResult.videosProcessed,
            newItems: result.newVideos,
            updatedItems: result.updatedVideos,
            skippedItems: result.skippedVideos,
            duration: sourceResult.duration,
            success: true
          })

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

          sourceResult.duration = Date.now() - sourceStartTime
          
          logIngestionOperation('SOURCE_BY_ID_FAILED', {
            sourceType: 'YouTube',
            sourceName: source.name,
            duration: sourceResult.duration,
            success: false,
            error: errorMsg
          })
        }

        result.sources.push(sourceResult)
      }

      const totalDuration = Date.now() - startTime
      
      if (result.errors.length > 0) {
        result.success = false
        logIngestionOperation('SOURCE_INGESTION_COMPLETED_WITH_ERRORS', {
          sourceType: 'YouTube',
          itemsFound: result.totalVideos,
          newItems: result.newVideos,
          updatedItems: result.updatedVideos,
          skippedItems: result.skippedVideos,
          duration: totalDuration,
          success: false,
          error: `${result.errors.length} errors occurred`
        })
      } else {
        logIngestionOperation('SOURCE_INGESTION_COMPLETED_SUCCESSFULLY', {
          sourceType: 'YouTube',
          itemsFound: result.totalVideos,
          newItems: result.newVideos,
          updatedItems: result.updatedVideos,
          skippedItems: result.skippedVideos,
          duration: totalDuration,
          success: true
        })
      }

    } catch (error) {
      const errorMsg = `Database connection error: ${error instanceof Error ? error.message : 'Unknown error'}`
      console.error(errorMsg)
      result.success = false
      result.errors.push(errorMsg)
      
      logIngestionOperation('SOURCE_INGESTION_FAILED', {
        sourceType: 'YouTube',
        duration: Date.now() - startTime,
        success: false,
        error: errorMsg
      })
    }

    return result
  }

  /**
   * Ingest videos from sources that need ingestion (haven't been ingested recently or have errors)
   */
  async ingestFromSourcesNeedingIngestion(hoursThreshold: number = 24): Promise<IngestionResult> {
    logIngestionOperation('START_NEEDED_INGESTION', {
      sourceType: 'YouTube',
      itemsFound: 0
    })
    
    const sources = await this.feedSourceManager.getSourcesNeedingIngestion(hoursThreshold)
    const youtubeSources = sources.filter(s => s.type === 'youtube')
    
    if (youtubeSources.length === 0) {
      logIngestionOperation('NO_SOURCES_NEED_INGESTION', {
        sourceType: 'YouTube',
        itemsFound: 0
      })
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

    logIngestionOperation('SOURCES_NEED_INGESTION', {
      sourceType: 'YouTube',
      itemsFound: youtubeSources.length
    })

    const sourceIds = youtubeSources.map(s => s.id)
    return await this.ingestFromSourceIds(sourceIds)
  }

  /**
   * Legacy method for backward compatibility
   */
  async ingestFromChannels(channels: ChannelConfig[]): Promise<IngestionResult> {
    const startTime = Date.now()
    
    logIngestionOperation('START_LEGACY_INGESTION', {
      sourceType: 'YouTube',
      itemsFound: channels.length
    })
    
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
        const channelStartTime = Date.now()
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
          logIngestionOperation('PROCESSING_LEGACY_CHANNEL', {
            sourceType: 'YouTube',
            sourceName: channel.name,
            itemsFound: 0
          })

          const videosResult = await this.youtubeService.getChannelVideos(
            channel.id, 
            channel.maxResults || 50
          )

          sourceResult.videosFound = videosResult.videos.length

          logIngestionOperation('LEGACY_VIDEOS_FETCHED', {
            sourceType: 'YouTube',
            sourceName: channel.name,
            itemsFound: videosResult.videos.length
          })

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

          sourceResult.duration = Date.now() - channelStartTime
          
          logIngestionOperation('LEGACY_CHANNEL_COMPLETED', {
            sourceType: 'YouTube',
            sourceName: channel.name,
            itemsFound: sourceResult.videosFound,
            itemsProcessed: sourceResult.videosProcessed,
            newItems: result.newVideos,
            updatedItems: result.updatedVideos,
            skippedItems: result.skippedVideos,
            duration: sourceResult.duration,
            success: true
          })

        } catch (error) {
          const errorMsg = `Error processing channel ${channel.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
          console.error(errorMsg)
          sourceResult.success = false
          sourceResult.error = errorMsg
          result.errors.push(errorMsg)

          sourceResult.duration = Date.now() - channelStartTime
          
          logIngestionOperation('LEGACY_CHANNEL_FAILED', {
            sourceType: 'YouTube',
            sourceName: channel.name,
            duration: sourceResult.duration,
            success: false,
            error: errorMsg
          })
        }

        result.sources.push(sourceResult)
      }

      const totalDuration = Date.now() - startTime
      
      if (result.errors.length > 0) {
        result.success = false
        logIngestionOperation('LEGACY_INGESTION_COMPLETED_WITH_ERRORS', {
          sourceType: 'YouTube',
          itemsFound: result.totalVideos,
          newItems: result.newVideos,
          updatedItems: result.updatedVideos,
          skippedItems: result.skippedVideos,
          duration: totalDuration,
          success: false,
          error: `${result.errors.length} errors occurred`
        })
      } else {
        logIngestionOperation('LEGACY_INGESTION_COMPLETED_SUCCESSFULLY', {
          sourceType: 'YouTube',
          itemsFound: result.totalVideos,
          newItems: result.newVideos,
          updatedItems: result.updatedVideos,
          skippedItems: result.skippedVideos,
          duration: totalDuration,
          success: true
        })
      }

    } catch (error) {
      const errorMsg = `Database connection error: ${error instanceof Error ? error.message : 'Unknown error'}`
      console.error(errorMsg)
      result.success = false
      result.errors.push(errorMsg)
      
      logIngestionOperation('LEGACY_INGESTION_FAILED', {
        sourceType: 'YouTube',
        duration: Date.now() - startTime,
        success: false,
        error: errorMsg
      })
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
          logIngestionOperation('VIDEO_UPDATED', {
            sourceType: 'YouTube',
            sourceName: video.channelTitle,
            itemsProcessed: 1,
            updatedItems: 1
          })
          return { status: 'updated' }
        } else {
          logIngestionOperation('VIDEO_UPDATE_FAILED', {
            sourceType: 'YouTube',
            sourceName: video.channelTitle,
            itemsProcessed: 1,
            skippedItems: 1
          })
          return { status: 'skipped' }
        }
      } else {
        // Create new resource
        const newResource = new Resource(resourceData)
        await newResource.save()
        
        logIngestionOperation('VIDEO_CREATED', {
          sourceType: 'YouTube',
          sourceName: video.channelTitle,
          itemsProcessed: 1,
          newItems: 1
        })
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
      logIngestionOperation('START_USERNAME_INGESTION', {
        sourceType: 'YouTube',
        sourceName: username,
        itemsFound: 0
      })
      
      const videosResult = await this.youtubeService.searchChannelVideos(username, maxResults.toString())
      
      if (videosResult.videos.length === 0) {
        logIngestionOperation('NO_VIDEOS_FOUND_FOR_USERNAME', {
          sourceType: 'YouTube',
          sourceName: username,
          itemsFound: 0
        })
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
      
      logIngestionOperation('USERNAME_INGESTION_COMPLETED', {
        sourceType: 'YouTube',
        sourceName: username,
        itemsFound: videosResult.videos.length
      })
      
      return await this.ingestFromChannel(channelId, channelName, maxResults)
      
    } catch (error) {
      const errorMsg = `Error ingesting from channel username ${username}: ${error instanceof Error ? error.message : 'Unknown error'}`
      console.error(errorMsg)
      
      logIngestionOperation('USERNAME_INGESTION_FAILED', {
        sourceType: 'YouTube',
        sourceName: username,
        success: false,
        error: errorMsg
      })
      
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
      
      logIngestionOperation('STATS_RETRIEVED', {
        sourceType: 'YouTube',
        itemsFound: totalResources,
        newItems: youtubeResources
      })
      
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
export { YouTubeIngestionService }
