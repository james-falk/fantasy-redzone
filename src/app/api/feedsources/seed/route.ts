import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import FeedSource from '@/models/FeedSource'

export async function POST() {
  try {
    const connection = await connectToDatabase()
    
    if (!connection) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 503 }
      )
    }

    // Define the YouTube channels to add
    const youtubeChannels = [
      {
        type: 'youtube' as const,
        identifier: 'UC7mnFgvC365vmb6b2EYFcjw',
        name: 'Fantasy Football Channel 1',
        description: 'Fantasy football content and analysis',
        category: 'Fantasy Football',
        maxResults: 10,
        enabled: true
      },
      {
        type: 'youtube' as const,
        identifier: 'UCv8IHFJEe14ijNK6jh-p0dQ',
        name: 'Fantasy Football Channel 2',
        description: 'Fantasy football insights and tips',
        category: 'Fantasy Football',
        maxResults: 10,
        enabled: true
      },
      {
        type: 'youtube' as const,
        identifier: 'UCxdIF1wU7jX-htzVCDmDu8A',
        name: 'Fantasy Football Channel 3',
        description: 'Fantasy football strategy and advice',
        category: 'Fantasy Football',
        maxResults: 10,
        enabled: true
      }
    ]

    const results = {
      created: 0,
      skipped: 0,
      errors: [] as string[]
    }

    for (const channelData of youtubeChannels) {
      try {
        // Check if source already exists
        const existingSource = await FeedSource.findOne({ identifier: channelData.identifier })
        if (existingSource) {
          results.skipped++
          continue
        }

        // Create new source
        const feedSource = new FeedSource(channelData)
        await feedSource.save()
        results.created++
        console.log(`✅ Created feed source: ${channelData.name}`)
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        results.errors.push(`Failed to create ${channelData.name}: ${errorMsg}`)
        console.error(`❌ Error creating feed source ${channelData.name}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Feed sources seeding completed',
      results
    })

  } catch (error) {
    console.error('❌ Seed error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const feedSourceManager = new FeedSourceManager()
    
    // Get current feed source statistics
    const stats = await feedSourceManager.getIngestionStats()
    
    return NextResponse.json({
      message: 'Feed source seeding information',
      stats,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error getting feed source stats:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to get feed source statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
