import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Resource from '@/models/Resource'

export async function POST() {
  try {
    const connection = await connectToDatabase()
    
    if (!connection) {
      return NextResponse.json(
        {
          success: false,
          error: 'Database connection not available during build time'
        },
        { status: 503 }
      )
    }

    // Remove ALL resources from the database
    const deleteResult = await Resource.deleteMany({})

    // Get remaining resources count
    const remainingCount = await Resource.countDocuments({})

    return NextResponse.json({
      success: true,
      message: 'Database cleanup completed - ALL resources removed',
      deletedCount: deleteResult.deletedCount,
      remainingResources: remainingCount,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

// GET - Show current database status
export async function GET() {
  try {
    const connection = await connectToDatabase()
    
    if (!connection) {
      return NextResponse.json(
        {
          success: false,
          error: 'Database connection not available during build time'
        },
        { status: 503 }
      )
    }

    const totalResources = await Resource.countDocuments({})
    const activeResources = await Resource.countDocuments({ isActive: true })
    const categories = await Resource.distinct('category')
    const sources = await Resource.distinct('source')

    return NextResponse.json({
      success: true,
      databaseStatus: {
        totalResources,
        activeResources,
        categories,
        sources,
        databaseName: 'fantasyredzone'
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Database status error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}
