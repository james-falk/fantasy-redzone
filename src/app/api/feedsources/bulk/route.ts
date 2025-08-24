import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import FeedSource from '@/models/FeedSource'
import { Types } from 'mongoose'

// POST /api/feedsources/bulk - Bulk create feed sources
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    
    const body = await request.json()
    const { sources } = body
    
    if (!sources || !Array.isArray(sources) || sources.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Sources array is required'
        },
        { status: 400 }
      )
    }
    
    const results = {
      created: 0,
      skipped: 0,
      errors: [] as string[]
    }
    
    for (const sourceData of sources) {
      try {
        // Check if source already exists
        const existingSource = await FeedSource.findOne({ identifier: sourceData.identifier })
        if (existingSource) {
          results.skipped++
          continue
        }
        
        // Create new source
        const feedSource = new FeedSource(sourceData)
        await feedSource.save()
        results.created++
        
      } catch (error) {
        results.errors.push(`Error creating ${sourceData.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        results.skipped++
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Bulk create completed',
      results
    })
    
  } catch (error) {
    console.error('Error in bulk create:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

// PUT /api/feedsources/bulk - Bulk update feed sources
export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase()
    
    const body = await request.json()
    const { action, ids, updates } = body
    
    if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Action and ids array are required'
        },
        { status: 400 }
      )
    }
    
    let result: any
    
    switch (action) {
      case 'enable':
        result = await FeedSource.updateMany(
          { _id: { $in: ids } },
          { $set: { enabled: true } }
        )
        break
        
      case 'disable':
        result = await FeedSource.updateMany(
          { _id: { $in: ids } },
          { $set: { enabled: false } }
        )
        break
        
      case 'update':
        if (!updates) {
          return NextResponse.json(
            {
              success: false,
              error: 'Updates object is required for update action'
            },
            { status: 400 }
          )
        }
        result = await FeedSource.updateMany(
          { _id: { $in: ids } },
          { $set: updates }
        )
        break
        
      case 'delete':
        result = await FeedSource.deleteMany({ _id: { $in: ids } })
        break
        
      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action. Must be one of: enable, disable, update, delete'
          },
          { status: 400 }
        )
    }
    
    // Handle different result types
    const resultData: Record<string, number> = {}
    
    if (action === 'delete') {
      // DeleteResult has deletedCount
      resultData.deletedCount = result.deletedCount || 0
    } else {
      // UpdateWriteOpResult has matchedCount and modifiedCount
      resultData.matchedCount = result.matchedCount || 0
      resultData.modifiedCount = result.modifiedCount || 0
    }
    
    return NextResponse.json({
      success: true,
      message: `Bulk ${action} completed successfully`,
      result: resultData
    })
    
  } catch (error) {
    console.error('Error in bulk operation:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}
