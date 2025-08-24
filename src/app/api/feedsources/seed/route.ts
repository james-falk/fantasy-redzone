import { NextRequest, NextResponse } from 'next/server'
import FeedSourceManager from '@/services/feed-source-manager'

export async function POST(request: NextRequest) {
  try {
    const feedSourceManager = new FeedSourceManager()
    
    console.log('Seeding default feed sources...')
    
    const result = await feedSourceManager.seedDefaultSources()
    
    return NextResponse.json({
      success: true,
      message: `Default feed sources seeded successfully. Created: ${result.created}, Skipped: ${result.skipped}`,
      result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error seeding default feed sources:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to seed default feed sources',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
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
