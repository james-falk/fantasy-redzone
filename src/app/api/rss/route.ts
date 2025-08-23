import { NextResponse } from "next/server";
import Parser from "rss-parser";
import { RSSContent } from "@/types/content";
import { APIResponse } from "@/types/content";

const parser = new Parser();

// Helper function to generate a slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
}

// Helper function to categorize articles
function categorizeArticle(title: string, content: string): string {
  const titleLower = title.toLowerCase()
  const contentLower = content.toLowerCase()
  
  if (titleLower.includes('waiver') || contentLower.includes('waiver')) return 'Waiver Wire'
  if (titleLower.includes('start') || titleLower.includes('sit') || contentLower.includes('start')) return 'Start/Sit'
  if (titleLower.includes('trade') || contentLower.includes('trade')) return 'Trades'
  if (titleLower.includes('rookie') || contentLower.includes('rookie')) return 'Rookies'
  if (titleLower.includes('dynasty') || contentLower.includes('dynasty')) return 'Dynasty'
  if (titleLower.includes('ranking') || contentLower.includes('ranking')) return 'Rankings'
  if (titleLower.includes('analysis') || contentLower.includes('analysis')) return 'Analysis'
  if (titleLower.includes('podcast') || contentLower.includes('podcast')) return 'Podcasts'
  
  return 'News' // Default category
}

// Helper function to extract tags
function extractTags(title: string, content: string): string[] {
  const tags = []
  const text = `${title} ${content}`.toLowerCase()
  
  // League types
  if (text.includes('dynasty')) tags.push('Dynasty')
  if (text.includes('redraft')) tags.push('Redraft')
  
  // Positions
  if (text.includes('qb') || text.includes('quarterback')) tags.push('QB')
  if (text.includes('rb') || text.includes('running back')) tags.push('RB')
  if (text.includes('wr') || text.includes('wide receiver')) tags.push('WR')
  if (text.includes('te') || text.includes('tight end')) tags.push('TE')
  if (text.includes('k') || text.includes('kicker')) tags.push('K')
  if (text.includes('dst') || text.includes('defense')) tags.push('DST')
  
  // Common fantasy terms
  if (text.includes('waiver')) tags.push('Waiver Wire')
  if (text.includes('trade')) tags.push('Trades')
  if (text.includes('rookie')) tags.push('Rookies')
  if (text.includes('start') || text.includes('sit')) tags.push('Start/Sit')
  
  return tags
}

export async function GET() {
  try {
    const feeds = [
      process.env.RSS_FEED_ESPN,
      process.env.RSS_FEED_FF_TODAY,
      process.env.RSS_FEED_YAHOO,
    ].filter(Boolean);

    console.log("[RSS Debug] Feed URLs:", feeds);

    const articles: RSSContent[] = [];

    for (const feedUrl of feeds) {
      try {
        console.log("[RSS Debug] Fetching:", feedUrl);
        const feed = await parser.parseURL(feedUrl!);
        console.log(`[RSS Debug] ${feed.title} -> ${feed.items?.length || 0} items`);
        
        articles.push(
          ...feed.items.map((item, index) => {
            const title = item.title || 'Untitled Article'
            const content = item.contentSnippet || item.summary || ''
            const sourceName = feed.title || 'Unknown Source'
            
            return {
              id: `rss_${sourceName.replace(/\s+/g, '_').toLowerCase()}_${index}`,
              title,
              shortDescription: content.slice(0, 200) + (content.length > 200 ? '...' : ''),
              cover: 'https://via.placeholder.com/400x200/1f2937/f9fafb?text=Fantasy+Football', // Default cover image
              slug: generateSlug(title),
              category: categorizeArticle(title, content),
              publishDate: item.pubDate || new Date().toISOString(),
              source: 'rss' as const,
              tags: extractTags(title, content),
              author: item.creator || item.author || undefined,
              url: item.link || '',
              content,
              pubDate: item.pubDate || new Date().toISOString(),
              sourceName
            } as RSSContent
          })
        );
      } catch (feedError) {
        console.error("[RSS Debug] Error parsing feed:", feedUrl, feedError);
      }
    }

    console.log("[RSS Debug] Total Articles:", articles.length);
    
    const response: APIResponse<RSSContent[]> = {
      success: true,
      data: articles
    }
    
    return NextResponse.json(response);
  } catch (err) {
    console.error("[RSS Debug] Route error:", err);
    
    const response: APIResponse<RSSContent[]> = {
      success: false,
      error: "Failed to fetch RSS"
    }
    
    return NextResponse.json(response, { status: 500 });
  }
} 