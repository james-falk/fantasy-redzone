import Parser from 'rss-parser'
import { NextRequest, NextResponse } from 'next/server'
import NodeCache from 'node-cache'
import { RSSContent, APIResponse } from '@/types/content'

// Initialize cache with 30-minute TTL for faster updates
const cache = new NodeCache({ stdTTL: 30 * 60 })

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  }
})

// Working RSS feed sources (tested and verified)
const RSS_SOURCES = [
  {
    name: 'ESPN NFL',
    url: 'https://www.espn.com/espn/rss/nfl/news',
    active: true
  },
  {
    name: 'NFL.com',
    url: 'http://www.nfl.com/rss/rsslanding?searchType=news&tags=news',
    active: true
  },
  {
    name: 'Pro Football Talk',
    url: 'https://profootballtalk.nbcsports.com/feed/',
    active: true
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

// Simple image extraction from RSS item
const extractImage = (item: { enclosure?: { url: string; type?: string }; content?: string; description?: string; summary?: string; link?: string }): string => {
  // Try enclosure first (most reliable for RSS)
  if (item.enclosure?.url && item.enclosure.type?.includes('image')) {
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
    } else if (imageUrl.startsWith('/') && item.link) {
      // Extract domain from article link
      try {
        const url = new URL(item.link)
        imageUrl = `${url.protocol}//${url.host}${imageUrl}`
      } catch {
        // Fallback for malformed URLs
        imageUrl = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&h=300&fit=crop&q=80&auto=format'
      }
    }
    return imageUrl
  }
  
  // Use consistent fallback image
  return 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&h=300&fit=crop&q=80&auto=format'
}

// Simple RSS parsing function
async function parseRSSFeed(source: typeof RSS_SOURCES[0]): Promise<RSSContent[]> {
  try {
    console.log(`🔍 Parsing RSS from ${source.name}: ${source.url}`)
    
    const feed = await parser.parseURL(source.url)
    
    if (!feed.items || feed.items.length === 0) {
      console.log(`❌ No items found in ${source.name} RSS feed`)
      return []
    }

    console.log(`✅ Found ${feed.items.length} items from ${source.name}`)

    // Transform to our content format
    const articles = feed.items.slice(0, 20).map((item: { title?: string; content?: string; description?: string; summary?: string; pubDate?: string; isoDate?: string; guid?: string; creator?: string; author?: string; link?: string; enclosure?: { url: string; type?: string } }) => {
      const title = item.title || 'Untitled Article'
      const content = item.content || item.description || item.summary || ''
      const shortDescription = content.replace(/<[^>]*>/g, '').slice(0, 200) + (content.length > 200 ? '...' : '')
      const pubDate = item.pubDate || item.isoDate || new Date().toISOString()
      
      // Extract image synchronously for simplicity
      const cover = extractImage(item)
      
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
        sourceName: source.name
      }
    })

    return articles

  } catch (error) {
    console.error(`❌ Failed to parse RSS from ${source.name}:`, error)
    return []
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '20')
  const specificUrl = searchParams.get('url')
  
  try {
    console.log('📰 RSS API called with limit:', limit)
    
    // Create cache key
    const cacheKey = `rss_all_sources_${limit}`
    
    // Check cache first
    const cachedData = cache.get<RSSContent[]>(cacheKey)
    if (cachedData && cachedData.length > 0) {
      console.log('✅ Returning cached RSS data:', cachedData.length, 'items')
      return NextResponse.json({
        success: true,
        data: cachedData.slice(0, limit),
        cached: true,
        total: cachedData.length
      } as APIResponse<RSSContent[]>)
    }

    let allArticles: RSSContent[] = []

    if (specificUrl) {
      // Parse specific URL if provided
      console.log('🔍 Parsing specific RSS URL:', specificUrl)
      try {
        const feed = await parser.parseURL(specificUrl)
        if (feed.items && feed.items.length > 0) {
          const articles = feed.items.slice(0, limit).map((item: { title?: string; content?: string; description?: string; summary?: string; pubDate?: string; isoDate?: string; guid?: string; creator?: string; author?: string; link?: string; enclosure?: { url: string; type?: string } }) => {
            const title = item.title || 'Untitled Article'
            const content = item.content || item.description || item.summary || ''
            const shortDescription = content.replace(/<[^>]*>/g, '').slice(0, 200) + (content.length > 200 ? '...' : '')
            const pubDate = item.pubDate || item.isoDate || new Date().toISOString()
            
            return {
              id: `rss_custom_${item.guid || generateSlug(title, pubDate)}`,
              title,
              shortDescription,
              cover: extractImage(item),
              slug: generateSlug(title, pubDate),
              category: categorizeArticle(title, content),
              publishDate: pubDate,
              source: 'rss' as const,
              tags: extractTags(title, content),
              author: item.creator || item.author || 'Unknown',
              url: item.link || '',
              content,
              pubDate,
              sourceName: 'Custom RSS'
            }
          })
          allArticles = articles
        }
      } catch (error) {
        console.error('❌ Failed to parse specific RSS URL:', error)
      }
    } else {
      // Parse all active sources
      const activeFeeds = RSS_SOURCES.filter(source => source.active)
      console.log('🔍 Parsing', activeFeeds.length, 'active RSS sources')
      
      // Parse feeds in parallel but with error handling
      const feedPromises = activeFeeds.map(source => parseRSSFeed(source))
      const feedResults = await Promise.allSettled(feedPromises)
      
      // Combine successful results
      feedResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.length > 0) {
          allArticles.push(...result.value)
          console.log(`✅ Added ${result.value.length} articles from ${activeFeeds[index].name}`)
        } else {
          console.log(`❌ Failed to get articles from ${activeFeeds[index].name}`)
        }
      })
    }

    // Sort by publish date (newest first) and limit results
    allArticles.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())
    const limitedArticles = allArticles.slice(0, limit)

    // Cache the results
    if (allArticles.length > 0) {
      cache.set(cacheKey, allArticles)
    }

    console.log(`✅ RSS API returning ${limitedArticles.length} articles (${allArticles.length} total)`)

    return NextResponse.json({
      success: true,
      data: limitedArticles,
      cached: false,
      total: allArticles.length
    } as APIResponse<RSSContent[]>)

  } catch (error) {
    console.error('❌ RSS API Error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch RSS content',
      data: []
    } as APIResponse<RSSContent[]>, { status: 500 })
  }
} 