import Parser from 'rss-parser'
import { NextRequest, NextResponse } from 'next/server'
import NodeCache from 'node-cache'
import { RSSContent, APIResponse } from '@/types/content'
import { logger } from '@/lib/logger'

// Initialize cache with 2-hour TTL to reduce server load
const cache = new NodeCache({ stdTTL: 2 * 60 * 60 })

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'media'],
      ['enclosure', 'enclosure'],
      ['description', 'description'],
      ['content:encoded', 'content']
    ]
  },
  timeout: 10000, // 10 second timeout
  headers: {
    'User-Agent': 'Fantasy Red Zone RSS Reader/1.0'
  }
})

// RSS feed sources with fallbacks
const RSS_SOURCES = [
  {
    name: 'ESPN Fantasy',
    url: 'https://www.espn.com/espn/rss/nfl/news',
    fallbackUrl: 'https://www.espn.com/espn/rss/news'
  },
  {
    name: 'FantasyPros',
    url: 'https://www.fantasypros.com/rss/nfl/news.xml',
    fallbackUrl: 'https://www.fantasypros.com/rss/news.xml'
  },
  {
    name: 'NFL.com',
    url: 'https://www.nfl.com/feeds/rss/news',
    fallbackUrl: 'https://www.nfl.com/rss/news'
  }
]

// Mapping for fantasy football categories based on article titles/content
const categorizeArticle = (title: string, content: string): string => {
  const titleLower = title.toLowerCase()
  const contentLower = content.toLowerCase()
  
  if (titleLower.includes('dynasty') || contentLower.includes('dynasty')) return 'Dynasty'
  if (titleLower.includes('rookie') || contentLower.includes('rookie')) return 'Rookies'
  if (titleLower.includes('trade') || contentLower.includes('trade')) return 'Trades'
  if (titleLower.includes('waiver') || contentLower.includes('waiver')) return 'Waiver Wire'
  if (titleLower.includes('start') || titleLower.includes('sit')) return 'Start/Sit'
  if (titleLower.includes('ranking') || contentLower.includes('ranking')) return 'Rankings'
  if (titleLower.includes('injury') || contentLower.includes('injury')) return 'News'
  if (titleLower.includes('podcast') || contentLower.includes('podcast')) return 'Podcasts'
  
  return 'Analysis' // Default category
}

// Extract tags from article title and content
const extractTags = (title: string, content: string): string[] => {
  const tags: string[] = []
  const text = `${title} ${content}`.toLowerCase()
  
  // Common fantasy football terms
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

// Generate slug from title
const generateSlug = (title: string, pubDate: string): string => {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 50)
  
  const dateSlug = new Date(pubDate).toISOString().slice(0, 10)
  return `rss-${dateSlug}-${slug}`
}

// Extract image from ESPN article page
const extractImageFromESPNPage = async (articleUrl: string): Promise<string> => {
  try {
    console.log('🔍 Fetching image from ESPN article:', articleUrl)
    const response = await fetch(articleUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    
    if (!response.ok) {
      console.log('❌ Failed to fetch article:', response.status)
      return ''
    }
    
    const html = await response.text()
    
    // Try to find the main article image using various ESPN patterns
    const patterns = [
      // ESPN's main article image
      /<meta property="og:image" content="([^"]+)"/i,
      // ESPN's featured image
      /<img[^>]+class="[^"]*featured[^"]*"[^>]+src="([^"]+)"/i,
      // ESPN's hero image
      /<img[^>]+class="[^"]*hero[^"]*"[^>]+src="([^"]+)"/i,
      // Any large ESPN image
      /https:\/\/a\.espncdn\.com\/combiner\/i\?img=[^"&\s]+/g,
      // General ESPN CDN images
      /https:\/\/[^"]*\.espncdn\.com\/[^"]*\.(jpg|jpeg|png|gif|webp)/gi
    ]
    
    for (const pattern of patterns) {
      const match = html.match(pattern)
      if (match && match[1]) {
        console.log('✅ Found ESPN article image:', match[1])
        return match[1]
      }
    }
    
    console.log('❌ No image found in ESPN article')
    return ''
  } catch (error) {
    console.log('❌ Error fetching ESPN article:', error)
    return ''
  }
}

// Extract image from various RSS formats
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const extractImage = async (item: any): Promise<string> => {
  console.log('🖼️  DEBUG: Extracting image for:', item.title?.substring(0, 50))
  
  // Try media:content first
  if (item.media && item.media.$ && item.media.$.url) {
    console.log('✅ Found media.$.url:', item.media.$.url)
    return item.media.$.url
  }
  
  // Try enclosure
  if (item.enclosure && item.enclosure.url) {
    console.log('✅ Found enclosure.url:', item.enclosure.url, 'type:', item.enclosure.type)
    if (item.enclosure.type?.startsWith('image')) {
      return item.enclosure.url
    }
  }
  
  // Try to find image in content/description
  const content = item.content || item.description || item.summary || ''
  console.log('🔍 Searching in content length:', content.length)
  
  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i)
  if (imgMatch && imgMatch[1]) {
    console.log('✅ Found img tag:', imgMatch[1])
    let imageUrl = imgMatch[1]
    // Handle relative URLs
    if (imageUrl.startsWith('//')) {
      imageUrl = 'https:' + imageUrl
    } else if (imageUrl.startsWith('/')) {
      // For ESPN, prepend their domain
      imageUrl = 'https://www.espn.com' + imageUrl
    }
    console.log('✅ Final image URL:', imageUrl)
    return imageUrl
  }
  
  // For ESPN articles, try to extract image from RSS content first
  if (item.link && item.link.includes('espn.com')) {
    // Try to find image in the RSS content itself
    const rssImageMatch = content.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i)
    if (rssImageMatch && rssImageMatch[1]) {
      console.log('✅ Found ESPN image in RSS content:', rssImageMatch[1])
      return rssImageMatch[1]
    }
    
    console.log('🏈 Using ESPN themed fallback image')
    // Use a reliable football-themed image
    return 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&h=300&fit=crop&q=80&auto=format'
  }
  
  console.log('❌ No image found, using consistent fallback')
  // Use a single consistent fallback image to avoid hydration issues
  return 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&h=300&fit=crop&q=80&auto=format' // Football field
}

// Robust RSS parsing with error handling and multiple sources
async function parseRSSWithFallback(source: typeof RSS_SOURCES[0], requestId: string): Promise<RSSContent[]> {
  const urls = [source.url, source.fallbackUrl].filter(Boolean)
  
  for (const url of urls) {
    try {
      logger.info(`🔍 Attempting to parse RSS from ${source.name}`, {
        requestId,
        operation: 'rss_parse',
        source: source.name,
        url
      })

      // First, fetch the content to validate it
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Fantasy Red Zone RSS Reader/1.0',
          'Accept': 'application/rss+xml, application/xml, text/xml',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache'
        },
        signal: AbortSignal.timeout(15000)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const contentType = response.headers.get('content-type') || ''
      const text = await response.text()
      
      logger.info(`RSS Response received`, {
        requestId,
        operation: 'rss_response',
        source: source.name,
        contentType,
        textLength: text.length,
        firstChars: text.substring(0, 50)
      })
      
      // Clean the text to remove any non-XML content before parsing
      let cleanedText = text.trim()
      
      // Remove any leading non-XML characters (like BOM, whitespace, or HTML content)
      const xmlMatch = cleanedText.match(/(<\?xml|<rss|<feed)/i)
      if (xmlMatch && xmlMatch.index && xmlMatch.index > 0) {
        logger.warn(`Removing ${xmlMatch.index} leading characters from RSS`, {
          requestId,
          operation: 'rss_cleanup',
          source: source.name,
          removedChars: cleanedText.substring(0, xmlMatch.index)
        })
        cleanedText = cleanedText.substring(xmlMatch.index)
      }
      
      // Final validation
      if (!cleanedText.trim()) {
        throw new Error('Empty RSS content after cleanup')
      }
      
      if (!cleanedText.match(/^(<\?xml|<rss|<feed)/i)) {
        throw new Error(`Invalid RSS format after cleanup - content type: ${contentType}, starts with: ${cleanedText.substring(0, 100)}`)
      }
      
      // Parse the cleaned RSS
      const feed = await parser.parseString(cleanedText)
      
      if (!feed.items || feed.items.length === 0) {
        throw new Error('No items found in RSS feed')
      }

      logger.info(`✅ Successfully parsed ${feed.items.length} items from ${source.name}`, {
        requestId,
        operation: 'rss_parse_success',
        source: source.name,
        url,
        itemCount: feed.items.length
      })

      // Transform to our content format
      const articles = await Promise.all(
        feed.items.slice(0, 25).map(async (item: { title?: string; content?: string; description?: string; pubDate?: string; guid?: string; creator?: string; author?: string; link?: string }) => {
          const title = item.title || 'Untitled Article'
          const content = item.content || item.description || ''
          const shortDescription = content.replace(/<[^>]*>/g, '').slice(0, 200)
          const pubDate = item.pubDate || new Date().toISOString()
          
          // Extract image
          const cover = await extractImage(item)
          
          return {
            id: `rss_${source.name.toLowerCase().replace(/\s+/g, '_')}_${item.guid || generateSlug(title, pubDate)}`,
            title,
            shortDescription,
            cover,
            slug: generateSlug(title, pubDate),
            category: categorizeArticle(title, content),
            publishDate: pubDate,
            source: 'rss' as const,
            tags: extractTags(title, content),
            author: item.creator || item.author || source.name,
            url: item.link || '',
            content,
            pubDate,
            sourceName: source.name // Add source attribution
          }
        })
      )

      return articles

    } catch (error) {
      logger.warn(`Failed to parse RSS from ${url}`, {
        requestId,
        operation: 'rss_parse_failed',
        source: source.name,
        url,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Continue to next URL if available
      continue
    }
  }
  
  // If all URLs failed
  logger.error(`All RSS URLs failed for ${source.name}`, new Error('All RSS parsing attempts failed'), {
    requestId,
    operation: 'rss_parse_all_failed',
    source: source.name,
    attemptedUrls: urls
  })
  
  return []
}

export async function GET(request: NextRequest) {
  const requestId = `rss_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const startTime = Date.now()
  const context = logger.createRequestContext(requestId, {
    operation: 'rss_fetch',
    userAgent: request.headers.get('user-agent')
  })
  
  const { searchParams } = new URL(request.url)
  const feedUrl = searchParams.get('url') || process.env.RSS_FEED_URL || 'https://www.espn.com/espn/rss/nfl/news'
  
  try {
    const limit = parseInt(searchParams.get('limit') || '20')
    
    // Create cache key
    const cacheKey = `rss_${encodeURIComponent(feedUrl)}_${limit}`
    
    // Check cache first
    const cachedData = cache.get<RSSContent[]>(cacheKey)
    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData,
        cached: true,
        total: cachedData.length
      } as APIResponse<RSSContent[]>)
    }

    // Parse RSS feed
    console.log('📰 Attempting to parse RSS feed:', feedUrl)
    const feed = await parser.parseURL(feedUrl)
    console.log('✅ RSS feed parsed successfully, items found:', feed.items?.length || 0)
    
    // Debug: Log the first item to see what image data is available
    if (feed.items && feed.items.length > 0) {
      const firstItem = feed.items[0]
      console.log('🔍 DEBUG: First RSS item structure:')
      console.log('- Title:', firstItem.title)
      console.log('- Media:', firstItem.media)
      console.log('- Enclosure:', firstItem.enclosure)
      console.log('- Content snippet:', firstItem.content?.substring(0, 200))
      console.log('- Description snippet:', firstItem.description?.substring(0, 200))
      console.log('- All keys:', Object.keys(firstItem))
    }
    
    if (!feed.items || feed.items.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No articles found in RSS feed',
        data: []
      } as APIResponse<RSSContent[]>)
    }

    // Transform to our content format with async image extraction
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const articlePromises = feed.items.slice(0, limit).map(async (item: any) => {
      const title = item.title || 'Untitled Article'
      const content = item.content || item.description || item.summary || ''
      const shortDescription = content.replace(/<[^>]*>/g, '').slice(0, 200) + (content.length > 200 ? '...' : '')
      const category = categorizeArticle(title, shortDescription)
      const tags = extractTags(title, shortDescription)
      const pubDate = item.pubDate || item.isoDate || new Date().toISOString()
      
      // Extract image asynchronously
      const cover = await extractImage(item)
      
      return {
        id: `rss_${item.guid || generateSlug(title, pubDate)}`,
        title,
        shortDescription,
        cover,
        slug: generateSlug(title, pubDate),
        category,
        publishDate: pubDate,
        source: 'rss' as const,
        tags,
        author: item.creator || item.author || feed.title,
        url: item.link || '',
        content: content,
        pubDate: pubDate
      }
    })

    // Wait for all image extractions to complete
    const articles: RSSContent[] = await Promise.all(articlePromises)

    // Cache the results
    cache.set(cacheKey, articles)

    return NextResponse.json({
      success: true,
      data: articles,
      cached: false,
      total: articles.length
    } as APIResponse<RSSContent[]>)

  } catch (error) {
    console.error('❌ RSS Parser Error:', error)
    console.error('Feed URL that failed:', searchParams.get('url') || process.env.RSS_FEED_URL || 'https://www.espn.com/espn/rss/nfl/news')
    
    // Try backup RSS feed if primary fails
    const feedUrl = searchParams.get('url')
    const backupUrl = process.env.BACKUP_RSS_FEED_URL
    
    if (!feedUrl && backupUrl && feedUrl !== backupUrl) {
      try {
        const feed = await parser.parseURL(backupUrl)
        const limit = parseInt(searchParams.get('limit') || '20')
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const articlePromises = feed.items.slice(0, limit).map(async (item: any) => {
          const title = item.title || 'Untitled Article'
          const content = item.content || item.description || ''
          const shortDescription = content.replace(/<[^>]*>/g, '').slice(0, 200)
          const pubDate = item.pubDate || new Date().toISOString()
          
          // Extract image asynchronously
          const cover = await extractImage(item)
          
          return {
            id: `rss_backup_${item.guid || generateSlug(title, pubDate)}`,
            title,
            shortDescription,
            cover,
            slug: generateSlug(title, pubDate),
            category: 'News',
            publishDate: pubDate,
            source: 'rss' as const,
            tags: [],
            author: item.creator || item.author || 'Unknown',
            url: item.link || '',
            content,
            pubDate
          }
        })
        
        const articles = await Promise.all(articlePromises)
        
        return NextResponse.json({
          success: true,
          data: articles,
          cached: false,
          total: articles.length
        } as APIResponse<RSSContent[]>)
        
      } catch (backupError) {
        console.error('Backup RSS Parser Error:', backupError)
      }
    }
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch RSS content',
      data: []
    } as APIResponse<RSSContent[]>, { status: 500 })
  }
} 