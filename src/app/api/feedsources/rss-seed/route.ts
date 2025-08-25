import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import FeedSource from '@/models/FeedSource'

const RSS_FEEDS = [
  {
    name: 'ESPN NFL News',
    identifier: 'https://www.espn.com/espn/rss/nfl/news',
    description: 'ESPN NFL news and analysis',
    category: 'Fantasy Football',
    maxResults: 20
  },
  {
    name: 'CBS Sports NFL',
    identifier: 'https://www.cbssports.com/rss/headlines/nfl',
    description: 'CBS Sports NFL news and updates',
    category: 'Fantasy Football',
    maxResults: 20
  },
  {
    name: 'Dynasty League Football',
    identifier: 'https://dynastyleaguefootball.com/feed/',
    description: 'Dynasty League Football analysis and insights',
    category: 'Fantasy Football',
    maxResults: 20
  },
  {
    name: 'Dynasty Nerds',
    identifier: 'https://www.dynastynerds.com/feed/',
    description: 'Dynasty Nerds fantasy football content',
    category: 'Fantasy Football',
    maxResults: 20
  },
  {
    name: 'Draft Sharks',
    identifier: 'https://www.draftsharks.com/rss/latest-news',
    description: 'Draft Sharks latest fantasy football news',
    category: 'Fantasy Football',
    maxResults: 20
  }
]

export async function POST() {
  try {
    console.log('🔄 [RSS_SEED] Starting RSS feed seeding...')
    
    const connection = await connectToDatabase()
    if (!connection) {
      console.error('❌ [RSS_SEED] Database connection failed')
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      )
    }

    const results = {
      created: 0,
      skipped: 0,
      errors: 0,
      details: [] as Array<{
        name: string
        status: 'created' | 'skipped' | 'error'
        error?: string
      }>
    }

    for (const feed of RSS_FEEDS) {
      try {
        // Check if feed already exists
        const existingFeed = await FeedSource.findOne({
          type: 'rss',
          identifier: feed.identifier
        })

        if (existingFeed) {
          console.log(`⏭️ [RSS_SEED] RSS feed "${feed.name}" already exists, skipping`)
          results.skipped++
          results.details.push({
            name: feed.name,
            status: 'skipped'
          })
          continue
        }

        // Create new RSS feed source
        const newFeedSource = new FeedSource({
          type: 'rss',
          identifier: feed.identifier,
          name: feed.name,
          description: feed.description,
          category: feed.category,
          maxResults: feed.maxResults,
          enabled: true
        })

        await newFeedSource.save()
        
        console.log(`✅ [RSS_SEED] Created RSS feed: ${feed.name}`)
        results.created++
        results.details.push({
          name: feed.name,
          status: 'created'
        })

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        console.error(`❌ [RSS_SEED] Error creating RSS feed "${feed.name}":`, errorMsg)
        results.errors++
        results.details.push({
          name: feed.name,
          status: 'error',
          error: errorMsg
        })
      }
    }

    console.log('✅ [RSS_SEED] RSS feed seeding completed:', {
      created: results.created,
      skipped: results.skipped,
      errors: results.errors
    })

    return NextResponse.json({
      success: true,
      message: 'RSS feeds seeded successfully',
      results
    })

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ [RSS_SEED] RSS feed seeding failed:', errorMsg)
    
    return NextResponse.json(
      { 
        error: 'RSS feed seeding failed',
        details: errorMsg
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    console.log('📊 [RSS_SEED] Getting RSS feed status...')
    
    const connection = await connectToDatabase()
    if (!connection) {
      console.error('❌ [RSS_SEED] Database connection failed')
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      )
    }

    const rssFeeds = await FeedSource.find({ type: 'rss' }).lean()
    
    console.log(`📊 [RSS_SEED] Found ${rssFeeds.length} RSS feeds in database`)

    return NextResponse.json({
      success: true,
      rssFeedsCount: rssFeeds.length,
      rssFeeds: rssFeeds.map(feed => ({
        id: feed._id,
        name: feed.name,
        identifier: feed.identifier,
        enabled: feed.enabled,
        lastIngested: feed.lastIngested,
        errorCount: feed.errorCount
      }))
    })

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ [RSS_SEED] Error getting RSS feed status:', errorMsg)
    
    return NextResponse.json(
      { 
        error: 'Failed to get RSS feed status',
        details: errorMsg
      },
      { status: 500 }
    )
  }
}
