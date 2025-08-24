import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { getEnvironmentConfig, logEnvironmentInfo } from '@/lib/environment'
import Resource from '@/models/Resource'
import FeedSource from '@/models/FeedSource'

interface DebugInfo {
  timestamp: string
  environment: {
    nodeEnv: string
    vercelEnv: string | undefined
    hasMongoUri: boolean
    hasYouTubeKey: boolean
    mongoUriLength: number
    youtubeKeyLength: number
    siteUrl: string
    siteName: string
    isDevelopment: boolean
    isProduction: boolean
    isVercel: boolean
  }
  database: {
    connectionStatus: 'connected' | 'failed' | 'not-attempted'
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
      createdAt: string
    }>
    sampleFeedSources: Array<{
      id: string | undefined
      type: string
      identifier: string
      name: string
      enabled: boolean
      createdAt: string
    }>
  }
  errors: string[]
}

export async function GET() {
  const debugInfo: DebugInfo = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV || 'unknown',
      vercelEnv: process.env.VERCEL_ENV,
      hasMongoUri: !!process.env.MONGODB_URI,
      hasYouTubeKey: !!process.env.YOUTUBE_API_KEY,
      mongoUriLength: process.env.MONGODB_URI?.length || 0,
      youtubeKeyLength: process.env.YOUTUBE_API_KEY?.length || 0,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'not-configured',
      siteName: process.env.NEXT_PUBLIC_SITE_NAME || 'not-configured',
      isDevelopment: process.env.NODE_ENV === 'development',
      isProduction: process.env.NODE_ENV === 'production',
      isVercel: !!process.env.VERCEL_ENV
    },
    database: {
      connectionStatus: 'not-attempted',
      resourceCount: 0,
      youtubeVideosCount: 0,
      feedSourcesCount: 0,
      sampleResources: [],
      sampleFeedSources: []
    },
    errors: []
  }

  try {
    // Log environment information
    logEnvironmentInfo()
    
    // Attempt database connection
    console.log('🔍 [DEBUG] Attempting database connection...')
    const connection = await connectToDatabase()
    
    if (connection) {
      debugInfo.database.connectionStatus = 'connected'
      console.log('✅ [DEBUG] Database connection successful')
      
      // Get resource counts
      try {
        const resourceCount = await Resource.countDocuments()
        debugInfo.database.resourceCount = resourceCount
        console.log(`📊 [DEBUG] Total resources: ${resourceCount}`)
        
        const youtubeVideosCount = await Resource.countDocuments({ source: 'YouTube' })
        debugInfo.database.youtubeVideosCount = youtubeVideosCount
        console.log(`📺 [DEBUG] YouTube videos: ${youtubeVideosCount}`)
        
        const feedSourcesCount = await FeedSource.countDocuments()
        debugInfo.database.feedSourcesCount = feedSourcesCount
        console.log(`📡 [DEBUG] Feed sources: ${feedSourcesCount}`)
        
        // Get sample resources
        const sampleResources = await Resource.find()
          .sort({ createdAt: -1 })
          .limit(3)
          .lean()
        
        debugInfo.database.sampleResources = sampleResources.map((resource: Record<string, unknown>) => ({
          id: (resource._id as { toString(): string })?.toString(),
          title: (resource.title as string) || 'Unknown',
          source: (resource.source as string) || 'Unknown',
          category: (resource.category as string) || 'Unknown',
          image: (resource.image as string) || 'No image',
          url: (resource.url as string) || 'No URL',
          createdAt: (resource.createdAt as string) || 'Unknown'
        }))
        
        // Get sample feed sources
        const sampleFeedSources = await FeedSource.find()
          .sort({ createdAt: -1 })
          .limit(3)
          .lean()
        
        debugInfo.database.sampleFeedSources = sampleFeedSources.map((source: Record<string, unknown>) => ({
          id: (source._id as { toString(): string })?.toString(),
          type: (source.type as string) || 'Unknown',
          identifier: (source.identifier as string) || 'Unknown',
          name: (source.name as string) || 'Unknown',
          enabled: (source.enabled as boolean) || false,
          createdAt: (source.createdAt as string) || 'Unknown'
        }))
        
      } catch (dbError) {
        const errorMsg = dbError instanceof Error ? dbError.message : 'Unknown database error'
        debugInfo.errors.push(`Database query error: ${errorMsg}`)
        console.error('❌ [DEBUG] Database query error:', dbError)
      }
      
    } else {
      debugInfo.database.connectionStatus = 'failed'
      debugInfo.errors.push('Database connection failed or returned null')
      console.log('❌ [DEBUG] Database connection failed')
    }
    
  } catch (error) {
    debugInfo.database.connectionStatus = 'failed'
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    debugInfo.errors.push(`Connection error: ${errorMsg}`)
    console.error('❌ [DEBUG] Connection error:', error)
  }

  console.log('🔍 [DEBUG] Debug information collected:', {
    environment: debugInfo.environment.nodeEnv,
    databaseStatus: debugInfo.database.connectionStatus,
    resourceCount: debugInfo.database.resourceCount,
    errorCount: debugInfo.errors.length
  })

  return NextResponse.json(debugInfo)
}
