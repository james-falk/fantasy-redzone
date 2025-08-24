import { connectToDatabase } from '@/lib/mongodb'
import FeedSource, { IFeedSource } from '@/models/FeedSource'

export interface FeedSourceConfig {
  id: string
  type: 'youtube' | 'rss'
  identifier: string
  name: string
  description?: string
  category?: string
  maxResults: number
  enabled: boolean
  lastIngested?: Date
  errorCount: number
  lastError?: string
}

export interface IngestionResult {
  sourceId: string
  sourceName: string
  success: boolean
  itemsProcessed: number
  error?: string
  duration: number
}

class FeedSourceManager {
  /**
   * Get all enabled feed sources
   */
  async getEnabledSources(type?: 'youtube' | 'rss'): Promise<FeedSourceConfig[]> {
    await connectToDatabase()
    
    const query: Record<string, unknown> = { enabled: true }
    if (type) {
      query.type = type
    }
    
    const sources = await FeedSource.find(query).sort({ name: 1 })
    
    return sources.map(source => ({
      id: source._id.toString(),
      type: source.type,
      identifier: source.identifier,
      name: source.name,
      description: source.description,
      category: source.category,
      maxResults: source.maxResults || 25,
      enabled: source.enabled,
      lastIngested: source.lastIngested,
      errorCount: source.errorCount,
      lastError: source.lastError
    }))
  }

  /**
   * Get feed sources by category
   */
  async getSourcesByCategory(category: string): Promise<FeedSourceConfig[]> {
    await connectToDatabase()
    
    const sources = await FeedSource.find({ enabled: true, category }).sort({ name: 1 })
    
    return sources.map(source => ({
      id: source._id.toString(),
      type: source.type,
      identifier: source.identifier,
      name: source.name,
      description: source.description,
      category: source.category,
      maxResults: source.maxResults || 25,
      enabled: source.enabled,
      lastIngested: source.lastIngested,
      errorCount: source.errorCount,
      lastError: source.lastError
    }))
  }

  /**
   * Get a specific feed source by ID
   */
  async getSourceById(id: string): Promise<FeedSourceConfig | null> {
    await connectToDatabase()
    
    const source = await FeedSource.findById(id)
    
    if (!source) {
      return null
    }
    
    return {
      id: source._id.toString(),
      type: source.type,
      identifier: source.identifier,
      name: source.name,
      description: source.description,
      category: source.category,
      maxResults: source.maxResults || 25,
      enabled: source.enabled,
      lastIngested: source.lastIngested,
      errorCount: source.errorCount,
      lastError: source.lastError
    }
  }

  /**
   * Update ingestion status for a feed source
   */
  async updateIngestionStatus(
    sourceId: string, 
    success: boolean, 
    itemsProcessed: number = 0,
    error?: string
  ): Promise<void> {
    await connectToDatabase()
    
    const source = await FeedSource.findById(sourceId)
    if (!source) {
      throw new Error(`Feed source with ID ${sourceId} not found`)
    }
    
    await source.updateIngestionStatus(success, error)
  }

  /**
   * Get ingestion statistics
   */
  async getIngestionStats(): Promise<{
    totalSources: number
    enabledSources: number
    youtubeSources: number
    rssSources: number
    sourcesByCategory: Record<string, number>
    recentErrors: number
    lastIngestion: Date | null
  }> {
    await connectToDatabase()
    
    const [
      totalSources,
      enabledSources,
      youtubeSources,
      rssSources,
      recentErrors,
      lastIngestion
    ] = await Promise.all([
      FeedSource.countDocuments({}),
      FeedSource.countDocuments({ enabled: true }),
      FeedSource.countDocuments({ type: 'youtube', enabled: true }),
      FeedSource.countDocuments({ type: 'rss', enabled: true }),
      FeedSource.countDocuments({ errorCount: { $gt: 0 } }),
      FeedSource.findOne({ enabled: true }, { lastIngested: 1 }, { sort: { lastIngested: -1 } })
    ])
    
    // Get sources by category
    const categoryStats = await FeedSource.aggregate([
      { $match: { enabled: true, category: { $exists: true, $ne: null } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
    
    const sourcesByCategory: Record<string, number> = {}
    categoryStats.forEach(stat => {
      sourcesByCategory[stat._id] = stat.count
    })
    
    return {
      totalSources,
      enabledSources,
      youtubeSources,
      rssSources,
      sourcesByCategory,
      recentErrors,
      lastIngestion: lastIngestion?.lastIngested || null
    }
  }

  /**
   * Seed default feed sources
   */
  async seedDefaultSources(): Promise<{
    created: number
    skipped: number
    errors: string[]
  }> {
    await connectToDatabase()
    
    const defaultSources = [
      // YouTube Fantasy Football Channels
      {
        type: 'youtube' as const,
        identifier: 'UCWJ2lWNubArHWmf3FIHbfcQ',
        name: 'Fantasy Footballers',
        description: 'Popular fantasy football podcast and content creators',
        category: 'Fantasy Football',
        maxResults: 25
      },
      {
        type: 'youtube' as const,
        identifier: 'UCBqJ7CbQqdPz0dOjT8nCv8A',
        name: 'FantasyPros',
        description: 'Professional fantasy football advice and analysis',
        category: 'Fantasy Football',
        maxResults: 20
      },
      {
        type: 'youtube' as const,
        identifier: 'UCYwVQJt9uQmIRxXut9cWP5A',
        name: 'CBS Sports Fantasy',
        description: 'CBS Sports fantasy football content',
        category: 'Fantasy Football',
        maxResults: 20
      },
      {
        type: 'youtube' as const,
        identifier: 'UCZgxJbLh5LVv2pBA7m2bxSw',
        name: 'NFL Fantasy',
        description: 'Official NFL fantasy football content',
        category: 'Fantasy Football',
        maxResults: 20
      },
      // RSS Feeds (placeholder examples)
      {
        type: 'rss' as const,
        identifier: 'https://www.espn.com/espn/rss/nfl/news',
        name: 'ESPN NFL News',
        description: 'ESPN NFL news and updates',
        category: 'NFL News',
        maxResults: 25
      },
      {
        type: 'rss' as const,
        identifier: 'https://www.cbssports.com/rss/headlines/nfl',
        name: 'CBS Sports NFL',
        description: 'CBS Sports NFL headlines',
        category: 'NFL News',
        maxResults: 25
      }
    ]
    
    const results = {
      created: 0,
      skipped: 0,
      errors: [] as string[]
    }
    
    for (const sourceData of defaultSources) {
      try {
        // Check if source already exists
        const existingSource = await FeedSource.findOne({ identifier: sourceData.identifier })
        if (existingSource) {
          results.skipped++
          continue
        }
        
        // Create new source
        const feedSource = new FeedSource(sourceData)
        await feedSource.save()
        results.created++
        
      } catch (error) {
        results.errors.push(`Error creating ${sourceData.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        results.skipped++
      }
    }
    
    return results
  }

  /**
   * Get sources that need ingestion (haven't been ingested recently or have errors)
   */
  async getSourcesNeedingIngestion(hoursThreshold: number = 24): Promise<FeedSourceConfig[]> {
    await connectToDatabase()
    
    const thresholdDate = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000)
    
    const sources = await FeedSource.find({
      enabled: true,
      $or: [
        { lastIngested: { $lt: thresholdDate } },
        { lastIngested: { $exists: false } },
        { errorCount: { $gt: 0 } }
      ]
    }).sort({ lastIngested: 1 })
    
    return sources.map(source => ({
      id: source._id.toString(),
      type: source.type,
      identifier: source.identifier,
      name: source.name,
      description: source.description,
      category: source.category,
      maxResults: source.maxResults || 25,
      enabled: source.enabled,
      lastIngested: source.lastIngested,
      errorCount: source.errorCount,
      lastError: source.lastError
    }))
  }
}

export default FeedSourceManager
