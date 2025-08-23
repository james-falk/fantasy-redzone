import { NextResponse } from "next/server";
import Parser from "rss-parser";

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

export async function GET() {
  try {
    const feeds = [
      process.env.RSS_FEED_ESPN,
      process.env.RSS_FEED_FF_TODAY,
      process.env.RSS_FEED_YAHOO,
    ].filter(Boolean);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const articles: any[] = [];

    for (const feedUrl of feeds) {
      try {
        const feed = await parser.parseURL(feedUrl!);

        articles.push(
          ...feed.items.map((item, index) => ({
            id: `rss_${feed.title?.replace(/\s+/g, '_').toLowerCase()}_${index}`,
            title: item.title || "No Title",
            shortDescription: (item.contentSnippet || item.content || "").slice(0, 200),
            cover: item.enclosure?.url || 'https://via.placeholder.com/400x200/1f2937/f9fafb?text=Fantasy+Football',
            slug: generateSlug(item.title || "no-title"),
            category: "Articles", // unify category for filtering
            publishDate: item.pubDate || new Date().toISOString(),
            source: "rss" as const,
            tags: [],
            url: item.link || "",
            sourceName: feed.title || "RSS Feed",
            author: item.creator || item.author,
          }))
        );
      } catch (feedError) {
        console.error("[RSS] Error parsing feed:", feedUrl, feedError);
      }
    }

    return NextResponse.json({ articles });
  } catch (err) {
    console.error("[RSS] Route error:", err);
    return NextResponse.json({ error: "Failed to fetch RSS" }, { status: 500 });
  }
} 