import { NextResponse } from "next/server";
import Parser from "rss-parser";

const parser = new Parser();

export async function GET() {
  try {
    const feeds = [
      process.env.RSS_FEED_ESPN!,
      process.env.RSS_FEED_FF_TODAY!,
      process.env.RSS_FEED_YAHOO!,
    ].filter(Boolean);

    const articles: Array<{
      title: string;
      link: string;
      pubDate: string;
      source: string;
      description: string;
      author: string;
    }> = [];

    for (const feedUrl of feeds) {
      try {
        console.log(`🏈 Fetching RSS from: ${feedUrl}`);
        const feed = await parser.parseURL(feedUrl);
        articles.push(
          ...feed.items.map((item) => ({
            title: item.title || 'Untitled Article',
            link: item.link || '',
            pubDate: item.pubDate || new Date().toISOString(),
            source: feed.title || 'Unknown Source',
            description: item.contentSnippet || item.summary || '',
            author: item.creator || item.author || 'Unknown'
          }))
        );
        console.log(`✅ Successfully fetched ${feed.items.length} articles from ${feed.title}`);
      } catch (feedError) {
        console.error(`❌ Failed to fetch feed ${feedUrl}:`, feedError);
        continue; // Skip failed feeds, don't break the whole process
      }
    }

    console.log(`🎯 Total articles fetched: ${articles.length}`);
    return NextResponse.json({ articles });
  } catch (err) {
    console.error("RSS error:", err);
    return NextResponse.json({ error: "Failed to fetch RSS" }, { status: 500 });
  }
} 