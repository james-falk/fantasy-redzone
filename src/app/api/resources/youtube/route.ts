import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Resource from '@/models/Resource'

// GET - Fetch YouTube resources with optional since parameter
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    
    const { searchParams } = new URL(request.url)
    const since = searchParams.get('since')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    
    // Build query for YouTube resources
    const query: Record<string, unknown> = {
      source: 'YouTube',
      isActive: true
    }
    
    // Add since filter if provided
    if (since) {
      try {
        const sinceDate = new Date(since)
        
        // Validate that the date is valid
        if (isNaN(sinceDate.getTime())) {
          return NextResponse.json(
            {
              success: false,
              error: 'Invalid date format. Please provide a valid ISO 8601 date string.'
            },
            { status: 400 }
          )
        }
        
        query.pubDate = { $gt: sinceDate }
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid date format. Please provide a valid ISO 8601 date string.'
          },
          { status: 400 }
        )
      }
    }
    
    // Execute query with pagination
    const skip = (page - 1) * limit
    const resources = await Resource.find(query)
      .sort({ pubDate: -1 }) // Sort by pubDate in descending order (newest first)
      .skip(skip)
      .limit(limit)
      .lean()

    const total = await Resource.countDocuments(query)
    
    return NextResponse.json({
      success: true,
      data: resources,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      filters: {
        since: since || null,
        source: 'YouTube',
        isActive: true
      }
    })
    
  } catch (error) {
    console.error('GET /api/resources/youtube error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}
