import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import FeedSource from '@/models/FeedSource'

// POST /api/feedsources/bulk - Bulk create feed sources
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    
    const body = await request.json()
    const { sources } = body
    
    if (!Array.isArray(sources) || sources.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Sources array is required and must not be empty'
        },
        { status: 400 }
      )
    }
    
    const results = {
      created: 0,
      skipped: 0,
      errors: [] as string[]
    }
    
    for (const source of sources) {
      try {
        const { type, identifier, name, description, category, maxResults, enabled = true } = source
        
        // Validation
        if (!type || !identifier || !name) {
          results.errors.push(`Missing required fields for source: ${name || identifier}`)
          results.skipped++
          continue
        }
        
        if (!['youtube', 'rss'].includes(type)) {
          results.errors.push(`Invalid type "${type}" for source: ${name}`)
          results.skipped++
          continue
        }
        
        // Check if identifier already exists
        const existingSource = await FeedSource.findOne({ identifier })
        if (existingSource) {
          results.errors.push(`Source with identifier "${identifier}" already exists`)
          results.skipped++
          continue
        }
        
        // Create new feed source
        const feedSource = new FeedSource({
          type,
          identifier,
          name,
          description,
          category,
          maxResults: maxResults || 25,
          enabled
        })
        
        await feedSource.save()
        results.created++
        
      } catch (error) {
        results.errors.push(`Error creating source: ${error instanceof Error ? error.message : 'Unknown error'}`)
        results.skipped++
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Bulk operation completed. Created: ${results.created}, Skipped: ${results.skipped}`,
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
    
    let result
    
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
    
    return NextResponse.json({
      success: true,
      message: `Bulk ${action} completed successfully`,
      result: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        deletedCount: result.deletedCount
      }
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
