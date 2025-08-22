import { NextResponse } from "next/server";
import Parser from "rss-parser";

const parser = new Parser();

export async function GET() {
  try {
    const feeds = [
      process.env.RSS_FEED_ESPN,
      process.env.RSS_FEED_FF_TODAY,
      process.env.RSS_FEED_YAHOO,
    ].filter(Boolean);

    console.log("[RSS Debug] Feed URLs:", feeds);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const articles: any[] = [];

    for (const feedUrl of feeds) {
      try {
        console.log("[RSS Debug] Fetching:", feedUrl);
        const feed = await parser.parseURL(feedUrl!);
        console.log(`[RSS Debug] ${feed.title} -> ${feed.items?.length || 0} items`);
        articles.push(
          ...feed.items.map((item) => ({
            title: item.title,
            link: item.link,
            pubDate: item.pubDate,
            source: feed.title,
          }))
        );
      } catch (feedError) {
        console.error("[RSS Debug] Error parsing feed:", feedUrl, feedError);
      }
    }

    console.log("[RSS Debug] Total Articles:", articles.length);
    return NextResponse.json({ articles });
  } catch (err) {
    console.error("[RSS Debug] Route error:", err);
    return NextResponse.json({ error: "Failed to fetch RSS" }, { status: 500 });
  }
} 