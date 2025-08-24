import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import FeedSource from '@/models/FeedSource'

// GET /api/feedsources - List all feed sources
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as 'youtube' | 'rss' | null
    const category = searchParams.get('category')
    const enabled = searchParams.get('enabled')
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    
    // Build query
    const query: Record<string, unknown> = {}
    if (type) query.type = type
    if (category) query.category = category
    if (enabled !== null) query.enabled = enabled === 'true'
    
    // Calculate pagination
    const skip = (page - 1) * limit
    
    // Execute query
    const [sources, total] = await Promise.all([
      FeedSource.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      FeedSource.countDocuments(query)
    ])
    
    // Calculate pagination info
    const totalPages = Math.ceil(total / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1
    
    return NextResponse.json({
      success: true,
      data: sources,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev
      },
      filters: {
        type,
        category,
        enabled: enabled !== null ? enabled === 'true' : undefined
      }
    })
    
  } catch (error) {
    console.error('Error fetching feed sources:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

// POST /api/feedsources - Create a new feed source
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    
    const body = await request.json()
    const { type, identifier, name, description, category, maxResults, enabled = true } = body
    
    // Validation
    if (!type || !identifier || !name) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: type, identifier, and name are required'
        },
        { status: 400 }
      )
    }
    
    if (!['youtube', 'rss'].includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid type. Must be either "youtube" or "rss"'
        },
        { status: 400 }
      )
    }
    
    // Check if identifier already exists
    const existingSource = await FeedSource.findOne({ identifier })
    if (existingSource) {
      return NextResponse.json(
        {
          success: false,
          error: `A feed source with identifier "${identifier}" already exists`
        },
        { status: 409 }
      )
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
    
    return NextResponse.json({
      success: true,
      message: 'Feed source created successfully',
      data: feedSource
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating feed source:', error)
    
    // Handle validation errors
    if (error instanceof Error && error.message.includes('must start with')) {
      return NextResponse.json(
        {
          success: false,
          error: error.message
        },
        { status: 400 }
      )
    }
    
    if (error instanceof Error && error.message.includes('must be a valid URL')) {
      return NextResponse.json(
        {
          success: false,
          error: error.message
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}
