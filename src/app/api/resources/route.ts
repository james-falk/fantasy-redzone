import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Resource from '@/models/Resource'
import { processResourceData, validateResourceData, buildSearchQuery } from '@/utils/resource-helpers'

// GET - Fetch all resources with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category')
    const source = searchParams.get('source')
    const search = searchParams.get('search')
    const keywords = searchParams.get('keywords')
    const isActive = searchParams.get('isActive')
    
    // Build query
    const query: Record<string, unknown> = {}

    if (category) query.category = category
    if (source) query.source = source
    if (isActive !== null) query.isActive = isActive === 'true'
    
    // Enhanced search functionality
    if (search) {
      // Use the enhanced search query builder
      const searchQuery = buildSearchQuery(search)
      if (Object.keys(searchQuery).length > 0) {
        Object.assign(query, searchQuery)
      }
    }
    
    // Keyword-specific search
    if (keywords) {
      const keywordArray = keywords.split(',').map(k => k.trim().toLowerCase())
      query.keywords = { $in: keywordArray }
    }
    
    // Execute query with pagination
    const skip = (page - 1) * limit
    const resources = await Resource.find(query)
      .sort({ pubDate: -1 })
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
      search: {
        term: search || null,
        keywords: keywords || null,
        query: Object.keys(query).length > 0 ? query : null
      }
    })
    
  } catch (error) {
    console.error('GET /api/resources error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

// POST - Create a new resource
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    
    const body = await request.json()
    
    // Validate the input data
    const validation = validateResourceData(body)
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid resource data',
          validationErrors: validation.errors
        },
        { status: 400 }
      )
    }
    
    // Process the data (applies fallback image logic and keyword extraction)
    const processedData = processResourceData(body)
    
    // Check if resource with same URL already exists
    const existingResource = await Resource.findOne({ url: processedData.url })
    if (existingResource) {
      return NextResponse.json(
        {
          success: false,
          error: 'Resource with this URL already exists'
        },
        { status: 409 }
      )
    }
    
    // Create and save the resource
    const resource = new Resource(processedData)
    const savedResource = await resource.save()
    
    return NextResponse.json({
      success: true,
      message: 'Resource created successfully',
      data: savedResource,
      keywords: {
        extracted: processedData.keywords,
        count: processedData.keywords?.length || 0
      }
    }, { status: 201 })
    
  } catch (error) {
    console.error('POST /api/resources error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}
