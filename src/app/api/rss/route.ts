import Parser from 'rss-parser'
import { NextRequest, NextResponse } from 'next/server'
import NodeCache from 'node-cache'
import { RSSContent, APIResponse } from '@/types/content'

// Initialize cache with 15-minute TTL for frequent updates
const cache = new NodeCache({ stdTTL: 15 * 60 })

const parser = new Parser({
  timeout: 15000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache'
  }
})

// ONLY ESPN Fantasy RSS - the most reliable fantasy football source
const ESPN_FANTASY_RSS_URL = 'https://www.espn.com/espn/rss/fantasy/news'

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

// Parse ESPN Fantasy RSS feed specifically
async function parseESPNFantasyRSS(): Promise<RSSContent[]> {
  try {
    console.log(`🏈 Parsing ESPN Fantasy RSS: ${ESPN_FANTASY_RSS_URL}`)
    
    const feed = await parser.parseURL(ESPN_FANTASY_RSS_URL)
    
    if (!feed.items || feed.items.length === 0) {
      console.error('❌ No items found in ESPN Fantasy RSS feed')
      return []
    }

    console.log(`✅ Found ${feed.items.length} ESPN Fantasy articles`)

    // Transform ESPN articles to our content format
    const articles = feed.items.slice(0, 25).map((item: { title?: string; content?: string; description?: string; summary?: string; pubDate?: string; isoDate?: string; guid?: string; creator?: string; author?: string; link?: string; enclosure?: { url: string; type?: string } }) => {
      const title = item.title || 'ESPN Fantasy Article'
      const content = item.content || item.description || item.summary || ''
      const shortDescription = content.replace(/<[^>]*>/g, '').slice(0, 200) + (content.length > 200 ? '...' : '')
      const pubDate = item.pubDate || item.isoDate || new Date().toISOString()
      
      // Extract image for article
      const cover = extractImage(item)
      
      return {
        id: `espn_fantasy_${item.guid || generateSlug(title, pubDate)}`,
        title,
        shortDescription,
        cover,
        slug: generateSlug(title, pubDate),
        category: categorizeArticle(title, content),
        publishDate: pubDate,
        source: 'rss' as const,
        tags: extractTags(title, content),
        author: item.creator || item.author || 'ESPN Fantasy',
        url: item.link || '',
        content,
        pubDate,
        sourceName: 'ESPN Fantasy'
      }
    })

    return articles

  } catch (error) {
    console.error(`❌ Failed to parse ESPN Fantasy RSS:`, error)
    throw error // Re-throw to handle in main function
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '20')
  
  try {
    console.log('🏈 ESPN Fantasy RSS API called with limit:', limit)
    
    // Create cache key for ESPN Fantasy specifically
    const cacheKey = `espn_fantasy_rss_${limit}`
    
    // Check cache first
    const cachedData = cache.get<RSSContent[]>(cacheKey)
    if (cachedData && cachedData.length > 0) {
      console.log('✅ Returning cached ESPN Fantasy data:', cachedData.length, 'items')
      return NextResponse.json({
        success: true,
        data: cachedData.slice(0, limit),
        cached: true,
        total: cachedData.length,
        source: 'ESPN Fantasy'
      } as APIResponse<RSSContent[]>)
    }

    // Parse ESPN Fantasy RSS feed
    const articles = await parseESPNFantasyRSS()
    
    if (articles.length === 0) {
      console.error('❌ No articles retrieved from ESPN Fantasy')
      return NextResponse.json({
        success: false,
        error: 'No articles found in ESPN Fantasy RSS feed',
        data: [],
        source: 'ESPN Fantasy'
      } as APIResponse<RSSContent[]>, { status: 503 })
    }

    // Sort by publish date (newest first) and limit results
    articles.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())
    const limitedArticles = articles.slice(0, limit)

    // Cache the results
    cache.set(cacheKey, articles)

    console.log(`✅ ESPN Fantasy RSS API returning ${limitedArticles.length} articles (${articles.length} total)`)

    return NextResponse.json({
      success: true,
      data: limitedArticles,
      cached: false,
      total: articles.length,
      source: 'ESPN Fantasy'
    } as APIResponse<RSSContent[]>)

  } catch (error) {
    console.error('❌ ESPN Fantasy RSS API Error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch ESPN Fantasy RSS content',
      data: [],
      source: 'ESPN Fantasy'
    } as APIResponse<RSSContent[]>, { status: 500 })
  }
} 