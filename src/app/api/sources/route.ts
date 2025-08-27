import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Resource from '@/models/Resource'

export async function GET() {
  try {
    const connection = await connectToDatabase()
    if (!connection) {
      return NextResponse.json({ error: 'Failed to connect to database' }, { status: 500 })
    }

    // Get all unique source names with better error handling
    const sources = await Resource.distinct('rawFeedItem.sourceName')
    
    // Also get some sample data to understand the structure
    const sampleResources = await Resource.find({}).limit(3).lean()
    
    // Get source statistics
    const sourceStats = await Resource.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$rawFeedItem.sourceName',
          count: { $sum: 1 },
          types: { $addToSet: '$source' }
        }
      },
      { $sort: { count: -1 } }
    ])

    return NextResponse.json({
      success: true,
      sources: sources.filter(s => s && s.trim() !== ''),
      totalSources: sources.length,
      sourceStats,
      sampleResources: sampleResources.map(r => ({
        id: r._id,
        title: r.title,
        sourceName: r.rawFeedItem?.sourceName,
        source: r.source,
        author: r.author
      }))
    })
  } catch (error) {
    console.error('Error fetching sources:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
