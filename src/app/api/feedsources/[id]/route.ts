import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import FeedSource from '@/models/FeedSource'

// GET /api/feedsources/[id] - Get a specific feed source
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()
    
    const { id } = await params
    const feedSource = await FeedSource.findById(id)
    
    if (!feedSource) {
      return NextResponse.json(
        {
          success: false,
          error: 'Feed source not found'
        },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: feedSource
    })
    
  } catch (error) {
    console.error('Error fetching feed source:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

// PUT /api/feedsources/[id] - Update a feed source
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()
    
    const { id } = await params
    const body = await request.json()
    const { type, identifier, name, description, category, maxResults, enabled } = body
    
    // Find the feed source
    const feedSource = await FeedSource.findById(id)
    
    if (!feedSource) {
      return NextResponse.json(
        {
          success: false,
          error: 'Feed source not found'
        },
        { status: 404 }
      )
    }
    
    // Check if identifier is being changed and if it already exists
    if (identifier && identifier !== feedSource.identifier) {
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
    }
    
    // Update fields
    if (type !== undefined) feedSource.type = type
    if (identifier !== undefined) feedSource.identifier = identifier
    if (name !== undefined) feedSource.name = name
    if (description !== undefined) feedSource.description = description
    if (category !== undefined) feedSource.category = category
    if (maxResults !== undefined) feedSource.maxResults = maxResults
    if (enabled !== undefined) feedSource.enabled = enabled
    
    await feedSource.save()
    
    return NextResponse.json({
      success: true,
      message: 'Feed source updated successfully',
      data: feedSource
    })
    
  } catch (error) {
    console.error('Error updating feed source:', error)
    
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

// DELETE /api/feedsources/[id] - Delete a feed source
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()
    
    const { id } = await params
    const feedSource = await FeedSource.findById(id)
    
    if (!feedSource) {
      return NextResponse.json(
        {
          success: false,
          error: 'Feed source not found'
        },
        { status: 404 }
      )
    }
    
    await FeedSource.findByIdAndDelete(id)
    
    return NextResponse.json({
      success: true,
      message: 'Feed source deleted successfully',
      data: {
        id: id,
        name: feedSource.name,
        type: feedSource.type
      }
    })
    
  } catch (error) {
    console.error('Error deleting feed source:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}
