import { NextRequest, NextResponse } from 'next/server'
import YouTubeIngestionService, { ChannelConfig } from '@/services/youtube-ingestion'
import FeedSourceManager from '@/services/feed-source-manager'

// Legacy default channels for backward compatibility
const DEFAULT_CHANNELS: ChannelConfig[] = [
  { id: 'UCWJ2lWNubArHWmf3FIHbfcQ', name: 'Fantasy Footballers', maxResults: 25 },
  { id: 'UCBqJ7CbQqdPz0dOjT8nCv8A', name: 'FantasyPros', maxResults: 20 },
  { id: 'UCYwVQJt9uQmIRxXut9cWP5A', name: 'CBS Sports Fantasy', maxResults: 20 },
  { id: 'UCZgxJbLh5LVv2pBA7m2bxSw', name: 'NFL Fantasy', maxResults: 20 },
  { id: 'UCX6OQ3DkcsbYNE6H8uQQuVA', name: 'MrBeast', maxResults: 10 } // For testing
]

export async function POST(request: NextRequest) {
  try {
    const ingestionService = new YouTubeIngestionService()
    const feedSourceManager = new FeedSourceManager()
    
    // Parse request body
    let requestBody: {
      mode?: string
      channelId?: string
      channelUsername?: string
      channels?: ChannelConfig[]
      sourceIds?: string[]
      hoursThreshold?: number
    } = {}
    try {
      const bodyText = await request.text()
      if (bodyText) {
        requestBody = JSON.parse(bodyText)
      }
    } catch (error) {
      // If no body or invalid JSON, use defaults
      console.log('No request body or invalid JSON, using defaults')
    }

    const { 
      mode = 'all', 
      channelId, 
      channelUsername, 
      channels = DEFAULT_CHANNELS,
      sourceIds,
      hoursThreshold = 24
    } = requestBody

    let result

    switch (mode) {
      case 'all':
        // Ingest from all enabled YouTube sources in the database
        console.log('Ingesting from all enabled YouTube sources...')
        result = await ingestionService.ingestFromAllSources()
        break

      case 'needing-ingestion':
        // Ingest from sources that need ingestion (haven't been ingested recently)
        console.log(`Ingesting from sources needing ingestion (threshold: ${hoursThreshold} hours)...`)
        result = await ingestionService.ingestFromSourcesNeedingIngestion(hoursThreshold)
        break

      case 'sources':
        // Ingest from specific source IDs
        if (!sourceIds || !Array.isArray(sourceIds) || sourceIds.length === 0) {
          return NextResponse.json(
            { error: 'sourceIds array is required for mode "sources"' },
            { status: 400 }
          )
        }
        console.log(`Ingesting from ${sourceIds.length} specific sources...`)
        result = await ingestionService.ingestFromSourceIds(sourceIds)
        break

      case 'channel':
        // Ingest from a specific channel ID
        if (!channelId) {
          return NextResponse.json(
            { error: 'channelId is required for mode "channel"' },
            { status: 400 }
          )
        }
        console.log(`Ingesting from channel: ${channelId}`)
        result = await ingestionService.ingestFromChannel(channelId)
        break

      case 'username':
        // Ingest from a channel username
        if (!channelUsername) {
          return NextResponse.json(
            { error: 'channelUsername is required for mode "username"' },
            { status: 400 }
          )
        }
        console.log(`Ingesting from channel username: ${channelUsername}`)
        result = await ingestionService.ingestFromChannelUsername(channelUsername)
        break

      case 'legacy':
        // Legacy mode: ingest from predefined channels array
        console.log(`Ingesting from ${channels.length} predefined channels...`)
        result = await ingestionService.ingestFromChannels(channels)
        break

      default:
        return NextResponse.json(
          { error: `Invalid mode: ${mode}. Valid modes: all, needing-ingestion, sources, channel, username, legacy` },
          { status: 400 }
        )
    }

    // Get additional stats
    const stats = await ingestionService.getIngestionStats()
    const feedSourceStats = await feedSourceManager.getIngestionStats()

    return NextResponse.json({
      success: result.success,
      message: `YouTube ingestion completed. Processed ${result.totalVideos} videos.`,
      result,
      stats,
      feedSourceStats,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('YouTube ingestion error:', error)
    
    return NextResponse.json(
      { 
        error: 'YouTube ingestion failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const ingestionService = new YouTubeIngestionService()
    const feedSourceManager = new FeedSourceManager()
    
    // Get ingestion statistics
    const stats = await ingestionService.getIngestionStats()
    const feedSourceStats = await feedSourceManager.getIngestionStats()
    
    // Get sources needing ingestion
    const sourcesNeedingIngestion = await feedSourceManager.getSourcesNeedingIngestion(24)
    const youtubeSourcesNeedingIngestion = sourcesNeedingIngestion.filter(s => s.type === 'youtube')
    
    return NextResponse.json({
      message: 'YouTube ingestion statistics',
      stats,
      feedSourceStats,
      sourcesNeedingIngestion: youtubeSourcesNeedingIngestion,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error getting YouTube ingestion stats:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to get ingestion statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
