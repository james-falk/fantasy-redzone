import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Resource from '@/models/Resource'
import FeedSource from '@/models/FeedSource'

interface DebugInfo {
  timestamp: string
  environment: {
    nodeEnv: string | undefined
    vercelEnv: string | undefined
    hasMongoUri: boolean
    hasYouTubeKey: boolean
    mongoUriLength: number
    youtubeKeyLength: number
  }
  database: {
    connectionStatus: string
    resourceCount: number
    youtubeVideosCount: number
    feedSourcesCount: number
    sampleResources: Array<{
      id: string | undefined
      title: string
      source: string
      category: string
      image: string
      url: string
      createdAt: Date
    }>
    sampleFeedSources: Array<{
      id: string | undefined
      name: string
      type: string
      identifier: string
      enabled: boolean
      createdAt: Date
    }>
  }
  errors: string[]
}

export async function GET() {
  const debugInfo: DebugInfo = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      hasMongoUri: !!process.env.MONGODB_URI,
      hasYouTubeKey: !!process.env.YOUTUBE_API_KEY,
      mongoUriLength: process.env.MONGODB_URI?.length || 0,
      youtubeKeyLength: process.env.YOUTUBE_API_KEY?.length || 0
    },
    database: {
      connectionStatus: 'unknown',
      resourceCount: 0,
      youtubeVideosCount: 0,
      feedSourcesCount: 0,
      sampleResources: [],
      sampleFeedSources: []
    },
    errors: []
  }

  try {
    console.log('🔍 [DEBUG API] Starting diagnostic check...')
    
    // Test database connection
    const connection = await connectToDatabase()
    debugInfo.database.connectionStatus = connection ? 'connected' : 'failed'
    console.log('🔍 [DEBUG API] Database connection:', debugInfo.database.connectionStatus)

    if (connection) {
      // Count total resources
      const totalResources = await Resource.countDocuments({})
      debugInfo.database.resourceCount = totalResources
      console.log('🔍 [DEBUG API] Total resources:', totalResources)

      // Count YouTube videos
      const youtubeVideosCount = await Resource.countDocuments({ source: 'YouTube' })
      debugInfo.database.youtubeVideosCount = youtubeVideosCount
      console.log('🔍 [DEBUG API] YouTube videos:', youtubeVideosCount)

      // Count feed sources
      const feedSourcesCount = await FeedSource.countDocuments({})
      debugInfo.database.feedSourcesCount = feedSourcesCount
      console.log('🔍 [DEBUG API] Feed sources:', feedSourcesCount)

      // Get sample resources
      const sampleResources = await Resource.find({})
        .sort({ createdAt: -1 })
        .limit(3)
        .lean()
        .select('title source category image url createdAt')

      debugInfo.database.sampleResources = sampleResources.map((resource: Record<string, unknown>) => ({
        id: (resource._id as { toString(): string })?.toString(),
        title: (resource.title as string) || '',
        source: (resource.source as string) || '',
        category: (resource.category as string) || '',
        image: (resource.image as string) || '',
        url: (resource.url as string) || '',
        createdAt: (resource.createdAt as Date) || new Date()
      }))

      // Get sample feed sources
      const sampleFeedSources = await FeedSource.find({})
        .sort({ createdAt: -1 })
        .limit(3)
        .lean()
        .select('name type identifier enabled createdAt')

      debugInfo.database.sampleFeedSources = sampleFeedSources.map((source: Record<string, unknown>) => ({
        id: (source._id as { toString(): string })?.toString(),
        name: (source.name as string) || '',
        type: (source.type as string) || '',
        identifier: (source.identifier as string) || '',
        enabled: (source.enabled as boolean) || false,
        createdAt: (source.createdAt as Date) || new Date()
      }))

      console.log('🔍 [DEBUG API] Sample resources:', debugInfo.database.sampleResources.length)
      console.log('🔍 [DEBUG API] Sample feed sources:', debugInfo.database.sampleFeedSources.length)

    } else {
      debugInfo.errors.push('Database connection failed')
    }

  } catch (error) {
    console.error('❌ [DEBUG API] Error during diagnostic:', error)
    debugInfo.errors.push(error instanceof Error ? error.message : 'Unknown error')
  }

  console.log('🔍 [DEBUG API] Diagnostic complete:', {
    connectionStatus: debugInfo.database.connectionStatus,
    resourceCount: debugInfo.database.resourceCount,
    youtubeVideosCount: debugInfo.database.youtubeVideosCount,
    errors: debugInfo.errors.length
  })

  return NextResponse.json(debugInfo)
}
