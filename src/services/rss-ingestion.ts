import { connectToDatabase } from '@/lib/mongodb'
import Resource from '@/models/Resource'
import Parser from 'rss-parser'
import FeedSourceManager from './feed-source-manager'

export interface RSSIngestionResult {
  success: boolean
  totalArticles: number
  newArticles: number
  updatedArticles: number
  skippedArticles: number
  errors: string[]
  sources: {
    sourceId: string
    sourceName: string
    articlesFound: number
    articlesProcessed: number
    success: boolean
    error?: string
    duration: number
  }[]
}

/**
 * Logs RSS ingestion operations with detailed information
 */
function logRSSIngestionOperation(operation: string, details: {
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
  
  console.log(`📊 [RSS_INGESTION] ${operation}:`, JSON.stringify(logEntry, null, 2))
}

class RSSIngestionService {
  private parser: Parser
  private feedSourceManager: FeedSourceManager

  constructor() {
    this.parser = new Parser({
      timeout: 10000,
      headers: {
        'User-Agent': 'Fantasy-Red-Zone-RSS-Parser/1.0'
      }
    })
    this.feedSourceManager = new FeedSourceManager()
  }

  /**
   * Ingest articles from all enabled RSS sources in the database
   */
  async ingestFromAllSources(): Promise<RSSIngestionResult> {
    const startTime = Date.now()
    const result: RSSIngestionResult = {
      success: true,
      totalArticles: 0,
      newArticles: 0,
      updatedArticles: 0,
      skippedArticles: 0,
      errors: [],
      sources: []
    }

    logRSSIngestionOperation('START_RSS_INGESTION', {
      sourceType: 'RSS'
    })

    try {
      // Get all enabled RSS sources
      const sources = await this.feedSourceManager.getEnabledSources('rss')
      
      if (sources.length === 0) {
        logRSSIngestionOperation('NO_RSS_SOURCES_FOUND', {
          sourceType: 'RSS',
          itemsFound: 0
        })
        return result
      }

      logRSSIngestionOperation('RSS_SOURCES_FOUND', {
        sourceType: 'RSS',
        itemsFound: sources.length
      })

      // Process each source
      for (const source of sources) {
        const sourceStartTime = Date.now()
        const sourceResult = {
          sourceId: source.id,
          sourceName: source.name,
          articlesFound: 0,
          articlesProcessed: 0,
          success: true,
          error: undefined as string | undefined,
          duration: 0
        }

        try {
          logRSSIngestionOperation('PROCESSING_RSS_SOURCE', {
            sourceType: 'RSS',
            sourceName: source.name,
            itemsFound: 0
          })

          // Parse RSS feed
          const feed = await this.parser.parseURL(source.identifier)
          const articles = feed.items || []

          sourceResult.articlesFound = articles.length

          logRSSIngestionOperation('RSS_ARTICLES_FETCHED', {
            sourceType: 'RSS',
            sourceName: source.name,
            itemsFound: articles.length
          })

          // Process each article
          for (const article of articles) {
            try {
              const articleResult = await this.processArticle(article, source.name)
              
              if (articleResult.status === 'new') {
                result.newArticles++
              } else if (articleResult.status === 'updated') {
                result.updatedArticles++
              } else {
                result.skippedArticles++
              }
              
              sourceResult.articlesProcessed++
              result.totalArticles++
              
            } catch (error) {
              const errorMsg = `Error processing article ${article.link}: ${error instanceof Error ? error.message : 'Unknown error'}`
              console.error(errorMsg)
              result.errors.push(errorMsg)
            }
          }

          // Update ingestion status
          await this.feedSourceManager.updateIngestionStatus(
            source.id,
            true,
            sourceResult.articlesProcessed
          )

          sourceResult.duration = Date.now() - sourceStartTime
          
          logRSSIngestionOperation('RSS_SOURCE_COMPLETED', {
            sourceType: 'RSS',
            sourceName: source.name,
            itemsFound: sourceResult.articlesFound,
            itemsProcessed: sourceResult.articlesProcessed,
            newItems: result.newArticles,
            updatedItems: result.updatedArticles,
            skippedItems: result.skippedArticles,
            duration: sourceResult.duration,
            success: true
          })

        } catch (error) {
          const errorMsg = `Error processing RSS source ${source.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
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
          
          logRSSIngestionOperation('RSS_SOURCE_FAILED', {
            sourceType: 'RSS',
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
        logRSSIngestionOperation('RSS_INGESTION_COMPLETED_WITH_ERRORS', {
          sourceType: 'RSS',
          itemsFound: result.totalArticles,
          newItems: result.newArticles,
          updatedItems: result.updatedArticles,
          skippedItems: result.skippedArticles,
          duration: totalDuration,
          success: false,
          error: `${result.errors.length} errors occurred`
        })
      } else {
        logRSSIngestionOperation('RSS_INGESTION_COMPLETED_SUCCESSFULLY', {
          sourceType: 'RSS',
          itemsFound: result.totalArticles,
          newItems: result.newArticles,
          updatedItems: result.updatedArticles,
          skippedItems: result.skippedArticles,
          duration: totalDuration,
          success: true
        })
      }

    } catch (error) {
      const errorMsg = `Database connection error: ${error instanceof Error ? error.message : 'Unknown error'}`
      console.error(errorMsg)
      result.success = false
      result.errors.push(errorMsg)
      
      logRSSIngestionOperation('RSS_INGESTION_FAILED', {
        sourceType: 'RSS',
        duration: Date.now() - startTime,
        success: false,
        error: errorMsg
      })
    }

    return result
  }

  /**
   * Process a single RSS article
   */
  private async processArticle(article: any, sourceName: string): Promise<{ status: 'new' | 'updated' | 'skipped' }> {
    try {
      // Extract image from article content or use default
      let image = ''
      if (article.enclosure && article.enclosure.url) {
        image = article.enclosure.url
      } else if (article['media:content'] && article['media:content']['$'] && article['media:content']['$'].url) {
        image = article['media:content']['$'].url
      } else if (article['media:thumbnail'] && article['media:thumbnail']['$'] && article['media:thumbnail']['$'].url) {
        image = article['media:thumbnail']['$'].url
      } else {
        // Try to extract image from content
        const contentMatch = article.content?.match(/<img[^>]+src="([^"]+)"/i)
        if (contentMatch) {
          image = contentMatch[1]
        }
      }

      // Get fallback image based on source
      const getFallbackImage = (sourceName: string) => {
        const lowerSource = sourceName.toLowerCase()
        if (lowerSource.includes('espn')) {
          return 'https://a.espncdn.com/i/espn/espn_logos/espn_red.png'
        } else if (lowerSource.includes('cbs')) {
          return '/fallback-images/cbs-logo.png'
        } else if (lowerSource.includes('nfl')) {
          return '/fallback-images/nfl-logo.png'
        } else if (lowerSource.includes('dynasty league football') || lowerSource.includes('dlf')) {
          return '/fallback-images/dynasty-league-football-fallback.jpeg'
        } else if (lowerSource.includes('dynasty nerds')) {
          return '/fallback-images/dynasty-nerds-fallback.jpeg'
        } else if (lowerSource.includes('draft sharks')) {
          return '/fallback-images/draftsharks-fallback.jpeg'
        } else {
          return '/fallback-images/news-default.svg'
        }
      }

      // Convert article to resource format
      const resourceData = {
        title: article.title || 'Untitled Article',
        description: article.contentSnippet || article.content || '',
        url: article.link || '',
        image: image || getFallbackImage(sourceName),
        source: 'RSS',
        author: article.creator || article.author || '',
        category: 'Article',
        tags: article.categories || [],
        pubDate: new Date(article.pubDate || article.isoDate || new Date()),
        rawFeedItem: {
          ...article,
          sourceName: sourceName // Store the RSS feed name as sourceName
        }
      }
      
      // Check if article already exists
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
          logRSSIngestionOperation('RSS_ARTICLE_UPDATED', {
            sourceType: 'RSS',
            sourceName: sourceName,
            itemsProcessed: 1,
            updatedItems: 1
          })
          return { status: 'updated' }
        } else {
          logRSSIngestionOperation('RSS_ARTICLE_UPDATE_FAILED', {
            sourceType: 'RSS',
            sourceName: sourceName,
            itemsProcessed: 1,
            skippedItems: 1
          })
          return { status: 'skipped' }
        }
      } else {
        // Create new resource
        const newResource = new Resource(resourceData)
        await newResource.save()
        
        logRSSIngestionOperation('RSS_ARTICLE_CREATED', {
          sourceType: 'RSS',
          sourceName: sourceName,
          itemsProcessed: 1,
          newItems: 1
        })
        return { status: 'new' }
      }
      
    } catch (error) {
      console.error(`Error processing RSS article ${article.link}:`, error)
      throw error
    }
  }

  /**
   * Ingest articles from specific sources by ID
   */
  async ingestFromSourceIds(sourceIds: string[]): Promise<RSSIngestionResult> {
    const startTime = Date.now()
    const result: RSSIngestionResult = {
      success: true,
      totalArticles: 0,
      newArticles: 0,
      updatedArticles: 0,
      skippedArticles: 0,
      errors: [],
      sources: []
    }

    logRSSIngestionOperation('START_RSS_SOURCE_INGESTION', {
      sourceType: 'RSS',
      itemsFound: sourceIds.length
    })

    try {
      for (const sourceId of sourceIds) {
        const source = await this.feedSourceManager.getSourceById(sourceId)
        
        if (!source) {
          const errorMsg = `RSS source with ID ${sourceId} not found`
          result.errors.push(errorMsg)
          continue
        }

        if (source.type !== 'rss') {
          const errorMsg = `Source ${source.name} is not an RSS source`
          result.errors.push(errorMsg)
          continue
        }

        if (!source.enabled) {
          const errorMsg = `RSS source ${source.name} is disabled`
          result.errors.push(errorMsg)
          continue
        }

        // Process single source
        const singleResult = await this.ingestFromAllSources()
        
        // Merge results
        result.totalArticles += singleResult.totalArticles
        result.newArticles += singleResult.newArticles
        result.updatedArticles += singleResult.updatedArticles
        result.skippedArticles += singleResult.skippedArticles
        result.errors.push(...singleResult.errors)
        result.sources.push(...singleResult.sources)
      }

      const totalDuration = Date.now() - startTime
      
      if (result.errors.length > 0) {
        result.success = false
        logRSSIngestionOperation('RSS_SOURCE_INGESTION_COMPLETED_WITH_ERRORS', {
          sourceType: 'RSS',
          itemsFound: result.totalArticles,
          newItems: result.newArticles,
          updatedItems: result.updatedArticles,
          skippedItems: result.skippedArticles,
          duration: totalDuration,
          success: false,
          error: `${result.errors.length} errors occurred`
        })
      } else {
        logRSSIngestionOperation('RSS_SOURCE_INGESTION_COMPLETED_SUCCESSFULLY', {
          sourceType: 'RSS',
          itemsFound: result.totalArticles,
          newItems: result.newArticles,
          updatedItems: result.updatedArticles,
          skippedItems: result.skippedArticles,
          duration: totalDuration,
          success: true
        })
      }

    } catch (error) {
      const errorMsg = `Database connection error: ${error instanceof Error ? error.message : 'Unknown error'}`
      console.error(errorMsg)
      result.success = false
      result.errors.push(errorMsg)
      
      logRSSIngestionOperation('RSS_SOURCE_INGESTION_FAILED', {
        sourceType: 'RSS',
        duration: Date.now() - startTime,
        success: false,
        error: errorMsg
      })
    }

    return result
  }
}

export default RSSIngestionService
