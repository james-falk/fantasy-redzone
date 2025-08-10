import Parser from 'rss-parser'
import { NextRequest, NextResponse } from 'next/server'
import NodeCache from 'node-cache'
import { RSSContent, APIResponse } from '@/types/content'

// Initialize cache with 15-minute TTL
const cache = new NodeCache({ stdTTL: 15 * 60 })

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'media'],
      ['enclosure', 'enclosure'],
      ['description', 'description'],
      ['content:encoded', 'content']
    ]
  }
})

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

// Extract image from various RSS formats
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const extractImage = (item: any): string => {
  // Try media:content first
  if (item.media && item.media.$ && item.media.$.url) {
    return item.media.$.url
  }
  
  // Try enclosure
  if (item.enclosure && item.enclosure.url && item.enclosure.type?.startsWith('image')) {
    return item.enclosure.url
  }
  
  // Try to find image in content/description
  const content = item.content || item.description || item.summary || ''
  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i)
  if (imgMatch && imgMatch[1]) {
    let imageUrl = imgMatch[1]
    // Handle relative URLs
    if (imageUrl.startsWith('//')) {
      imageUrl = 'https:' + imageUrl
    } else if (imageUrl.startsWith('/')) {
      // For ESPN, prepend their domain
      imageUrl = 'https://www.espn.com' + imageUrl
    }
    return imageUrl
  }
  
  // Try to extract from ESPN-specific formats
  if (item.link && item.link.includes('espn.com')) {
    // Use ESPN's default NFL image
    return 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/default.png&w=350&h=254'
  }
  
  // Default fantasy football themed image
  return 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&h=300&fit=crop&q=80'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const feedUrl = searchParams.get('url') || process.env.RSS_FEED_URL || 'https://www.espn.com/espn/rss/nfl/news'
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
    
    if (!feed.items || feed.items.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No articles found in RSS feed',
        data: []
      } as APIResponse<RSSContent[]>)
    }

    // Transform to our content format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const articles: RSSContent[] = feed.items.slice(0, limit).map((item: any) => {
      const title = item.title || 'Untitled Article'
      const content = item.content || item.description || item.summary || ''
      const shortDescription = content.replace(/<[^>]*>/g, '').slice(0, 200) + (content.length > 200 ? '...' : '')
      const category = categorizeArticle(title, shortDescription)
      const tags = extractTags(title, shortDescription)
      const pubDate = item.pubDate || item.isoDate || new Date().toISOString()
      
      return {
        id: `rss_${item.guid || generateSlug(title, pubDate)}`,
        title,
        shortDescription,
        cover: extractImage(item),
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
    const { searchParams } = new URL(request.url)
    const feedUrl = searchParams.get('url')
    const backupUrl = process.env.BACKUP_RSS_FEED_URL
    
    if (!feedUrl && backupUrl && feedUrl !== backupUrl) {
      try {
        const feed = await parser.parseURL(backupUrl)
        const limit = parseInt(searchParams.get('limit') || '20')
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const articles: RSSContent[] = feed.items.slice(0, limit).map((item: any) => {
          const title = item.title || 'Untitled Article'
          const content = item.content || item.description || ''
          const shortDescription = content.replace(/<[^>]*>/g, '').slice(0, 200)
          const pubDate = item.pubDate || new Date().toISOString()
          
          return {
            id: `rss_backup_${item.guid || generateSlug(title, pubDate)}`,
            title,
            shortDescription,
            cover: extractImage(item),
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