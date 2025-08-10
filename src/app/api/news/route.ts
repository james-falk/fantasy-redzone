import { NextRequest, NextResponse } from 'next/server'
import NodeCache from 'node-cache'
import * as cheerio from 'cheerio'
import Parser from 'rss-parser'
import { NewsArticle, NewsSource } from '@/types/news'
import { getEnabledNewsSources } from '@/config/news-sources'
import { APIResponse } from '@/types/content'

// Initialize cache with 15-minute TTL for news
const cache = new NodeCache({ stdTTL: 15 * 60 })
const parser = new Parser()

// Helper function to categorize news articles
const categorizeArticle = (title: string, content: string): string => {
  const titleLower = title.toLowerCase()
  const contentLower = content.toLowerCase()
  
  if (titleLower.includes('injury') || contentLower.includes('injury')) return 'Injury Report'
  if (titleLower.includes('trade') || contentLower.includes('trade')) return 'Trades'
  if (titleLower.includes('waiver') || contentLower.includes('waiver')) return 'Waiver Wire'
  if (titleLower.includes('start') || titleLower.includes('sit')) return 'Start/Sit'
  if (titleLower.includes('ranking') || contentLower.includes('ranking')) return 'Rankings'
  if (titleLower.includes('draft') || contentLower.includes('draft')) return 'Draft'
  if (titleLower.includes('dynasty') || contentLower.includes('dynasty')) return 'Dynasty'
  if (titleLower.includes('rookie') || contentLower.includes('rookie')) return 'Rookies'
  
  return 'News'
}

// Helper function to extract tags from article
const extractTags = (title: string, content: string): string[] => {
  const tags: string[] = []
  const text = `${title} ${content}`.toLowerCase()
  
  // Player positions
  if (text.includes('quarterback') || text.includes(' qb ')) tags.push('QB')
  if (text.includes('running back') || text.includes(' rb ')) tags.push('RB')
  if (text.includes('wide receiver') || text.includes(' wr ')) tags.push('WR')
  if (text.includes('tight end') || text.includes(' te ')) tags.push('TE')
  if (text.includes('defense') || text.includes('dst')) tags.push('Defense')
  if (text.includes('kicker') || text.includes(' k ')) tags.push('Kicker')
  
  // League types
  if (text.includes('dynasty')) tags.push('Dynasty')
  if (text.includes('redraft')) tags.push('Redraft')
  if (text.includes('superflex')) tags.push('Superflex')
  if (text.includes('ppr')) tags.push('PPR')
  
  // Timing
  if (text.includes('week ')) tags.push('Weekly')
  if (text.includes('season')) tags.push('Season-Long')
  
  return [...new Set(tags)]
}

// Function to fetch RSS content
async function fetchRSSContent(source: NewsSource): Promise<NewsArticle[]> {
  try {
    const feed = await parser.parseURL(source.url)
    
    return feed.items.slice(0, 10).map((item, index) => {
      const title = item.title || 'Untitled Article'
      const content = item.contentSnippet || item.summary || ''
      const category = categorizeArticle(title, content)
      const tags = extractTags(title, content)
      
      return {
        id: `news_${source.id}_${index}`,
        title,
        shortDescription: content.slice(0, 200) + (content.length > 200 ? '...' : ''),
        content,
        cover: item.enclosure?.url || '/placeholder-news.jpg',
        slug: `news-${source.id}-${item.guid?.replace(/[^a-zA-Z0-9]/g, '-') || index}`,
        category,
        publishDate: item.pubDate || new Date().toISOString(),
        source: 'news' as const,
        tags,
        url: item.link || source.url,
        sourceId: source.id,
        sourceName: source.name,
        author: item.creator || item['dc:creator'] || undefined
      }
    })
  } catch (error) {
    console.error(`Error fetching RSS from ${source.name}:`, error)
    return []
  }
}

// Function to scrape web content
async function scrapeWebContent(source: NewsSource): Promise<NewsArticle[]> {
  try {
    const response = await fetch(source.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        ...source.headers
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const html = await response.text()
    const $ = cheerio.load(html)
    const articles: NewsArticle[] = []
    
    if (!source.selector) {
      return []
    }
    
    // Find all article containers
    const articleElements = $(source.selector.title).slice(0, 10)
    
    articleElements.each((index, element) => {
      try {
        const $element = $(element)
        const $container = $element.closest('article, .article, .story, .card, .item').length > 0 
          ? $element.closest('article, .article, .story, .card, .item')
          : $element.parent()
        
        const title = $element.text().trim() || 'Untitled Article'
        const content = source.selector?.content ? $container.find(source.selector.content).first().text().trim() : ''
        const dateText = source.selector?.date ? 
                        ($container.find(source.selector.date).first().text().trim() || 
                         $container.find(source.selector.date).first().attr('datetime') || '') : ''
        const link = $element.attr('href') || 
                    (source.selector?.link ? $container.find(source.selector.link).first().attr('href') : '') || 
                    source.url
        const image = $container.find(source.selector?.image || 'img').first().attr('src') || '/placeholder-news.jpg'
        
        if (title && title.length > 10) { // Filter out navigation items
          const category = categorizeArticle(title, content)
          const tags = extractTags(title, content)
          
          articles.push({
            id: `news_${source.id}_${index}`,
            title,
            shortDescription: content.slice(0, 200) + (content.length > 200 ? '...' : ''),
            content,
            cover: image.startsWith('http') ? image : `${new URL(source.url).origin}${image}`,
            slug: `news-${source.id}-${title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`,
            category,
            publishDate: dateText ? new Date(dateText).toISOString() : new Date().toISOString(),
            source: 'news' as const,
            tags,
            url: link.startsWith('http') ? link : `${new URL(source.url).origin}${link}`,
            sourceId: source.id,
            sourceName: source.name
          })
        }
      } catch (error) {
        console.error(`Error processing article ${index} from ${source.name}:`, error)
      }
    })
    
    return articles
  } catch (error) {
    console.error(`Error scraping ${source.name}:`, error)
    return []
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const sourceId = searchParams.get('source')
    
    // Create cache key
    const cacheKey = `news_${limit}_${sourceId || 'all'}`
    
    // Check cache first
    const cachedData = cache.get<NewsArticle[]>(cacheKey)
    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData,
        cached: true,
        total: cachedData.length
      } as APIResponse<NewsArticle[]>)
    }
    
    // Get enabled news sources
    const sources = getEnabledNewsSources()
    const filteredSources = sourceId ? sources.filter(s => s.id === sourceId) : sources
    
    if (filteredSources.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No news sources configured or found',
        data: []
      } as APIResponse<NewsArticle[]>)
    }
    
    console.log(`Fetching news from ${filteredSources.length} sources...`)
    
    // Fetch from all sources in parallel
    const fetchPromises = filteredSources.map(async (source) => {
      try {
        if (source.type === 'rss') {
          return await fetchRSSContent(source)
        } else if (source.type === 'scrape') {
          return await scrapeWebContent(source)
        }
        return []
      } catch (error) {
        console.error(`Error fetching from ${source.name}:`, error)
        return []
      }
    })
    
    const results = await Promise.allSettled(fetchPromises)
    const allArticles: NewsArticle[] = []
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allArticles.push(...result.value)
        console.log(`✅ Fetched ${result.value.length} articles from ${filteredSources[index].name}`)
      } else {
        console.error(`❌ Failed to fetch from ${filteredSources[index].name}:`, result.reason)
      }
    })
    
    // Remove duplicates and sort by date
    const uniqueArticles = allArticles.filter((article, index, self) => 
      index === self.findIndex(a => a.title === article.title)
    )
    
    const sortedArticles = uniqueArticles
      .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())
      .slice(0, limit)
    
    // Cache the results
    cache.set(cacheKey, sortedArticles)
    
    console.log(`📰 Retrieved ${sortedArticles.length} unique news articles`)
    
    return NextResponse.json({
      success: true,
      data: sortedArticles,
      cached: false,
      total: sortedArticles.length,
      sources: filteredSources.map(s => s.name)
    } as APIResponse<NewsArticle[]> & { sources: string[] })
    
  } catch (error) {
    console.error('News API Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch news',
      data: []
    } as APIResponse<NewsArticle[]>, { status: 500 })
  }
}
