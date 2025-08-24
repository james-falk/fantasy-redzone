import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Resource from '@/models/Resource'
import { processResourceData, validateResourceData } from '@/utils/resource-helpers'

// GET - Fetch a single resource by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()
    
    const { id } = await params
    const resource = await Resource.findById(id)
    
    if (!resource) {
      return NextResponse.json(
        {
          success: false,
          error: 'Resource not found'
        },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: resource
    })
    
  } catch (error) {
    console.error('GET /api/resources/[id] error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

// PUT - Update a resource
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()
    
    const { id } = await params
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
    
    // Process the data (applies fallback image logic)
    const processedData = processResourceData(body)
    
    // Check if URL is being changed and if it conflicts with existing resource
    if (processedData.url) {
      const existingResource = await Resource.findOne({ 
        url: processedData.url,
        _id: { $ne: id } // Exclude current resource
      })
      if (existingResource) {
        return NextResponse.json(
          {
            success: false,
            error: 'Resource with this URL already exists'
          },
          { status: 409 }
        )
      }
    }
    
    // Update the resource
    const updatedResource = await Resource.findByIdAndUpdate(
      id,
      { ...processedData, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
    
    if (!updatedResource) {
      return NextResponse.json(
        {
          success: false,
          error: 'Resource not found'
        },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Resource updated successfully',
      data: updatedResource
    })
    
  } catch (error) {
    console.error('PUT /api/resources/[id] error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

// DELETE - Delete a resource
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()
    
    const { id } = await params
    const deletedResource = await Resource.findByIdAndDelete(id)
    
    if (!deletedResource) {
      return NextResponse.json(
        {
          success: false,
          error: 'Resource not found'
        },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Resource deleted successfully',
      data: deletedResource
    })
    
  } catch (error) {
    console.error('DELETE /api/resources/[id] error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}
