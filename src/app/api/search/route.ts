import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Resource from '@/models/Resource'
import { buildSearchQuery } from '@/utils/resource-helpers'

// GET - Enhanced search with keyword matching and text search
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category')
    const source = searchParams.get('source')
    const keywords = searchParams.get('keywords')
    
    if (!query.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Search query is required'
      }, { status: 400 })
    }
    
    // Build the search query
    const searchQuery = buildSearchQuery(query)
    
    // Add additional filters
    const finalQuery: Record<string, unknown> = {
      ...searchQuery,
      isActive: true
    }
    
    if (category) finalQuery.category = category
    if (source) finalQuery.source = source
    
    // Keyword-specific search
    if (keywords) {
      const keywordArray = keywords.split(',').map(k => k.trim().toLowerCase())
      finalQuery.keywords = { $in: keywordArray }
    }
    
    // Execute search with pagination
    const skip = (page - 1) * limit
    
    // Use text score for relevance ranking when text search is available
    const searchResults = await Resource.find(finalQuery)
      .sort({ 
        score: { $meta: 'textScore' }, // Sort by text relevance score
        pubDate: -1 // Then by publication date
      })
      .skip(skip)
      .limit(limit)
      .lean()
    
    const total = await Resource.countDocuments(finalQuery)
    
    // Enhance results with search relevance information
    const enhancedResults = searchResults.map(resource => {
      const result = {
        ...resource,
        searchRelevance: {
          hasExactKeywordMatch: resource.keywords?.some(keyword => 
            query.toLowerCase().includes(keyword.toLowerCase()) || 
            keyword.toLowerCase().includes(query.toLowerCase())
          ) || false,
          hasTextMatch: resource.title.toLowerCase().includes(query.toLowerCase()) || 
                       resource.description.toLowerCase().includes(query.toLowerCase()),
          keywordMatches: resource.keywords?.filter(keyword => 
            query.toLowerCase().includes(keyword.toLowerCase()) || 
            keyword.toLowerCase().includes(query.toLowerCase())
          ) || []
        }
      }
      return result
    })
    
    return NextResponse.json({
      success: true,
      query: query,
      data: enhancedResults,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      search: {
        term: query,
        filters: {
          category: category || null,
          source: source || null,
          keywords: keywords || null
        },
        query: finalQuery
      }
    })
    
  } catch (error) {
    console.error('GET /api/search error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}
