import { NextResponse } from 'next/server'
import RSSIngestionService from '@/services/rss-ingestion'

export async function POST() {
  try {
    console.log('🔄 [RSS_INGEST] Starting RSS ingestion...')
    
    const rssIngestionService = new RSSIngestionService()
    const result = await rssIngestionService.ingestFromAllSources()
    
    console.log('✅ [RSS_INGEST] RSS ingestion completed:', {
      success: result.success,
      totalArticles: result.totalArticles,
      newArticles: result.newArticles,
      updatedArticles: result.updatedArticles,
      skippedArticles: result.skippedArticles,
      errors: result.errors.length
    })

    return NextResponse.json({
      success: true,
      message: 'RSS ingestion completed',
      result
    })

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ [RSS_INGEST] RSS ingestion failed:', errorMsg)
    
    return NextResponse.json(
      { 
        error: 'RSS ingestion failed',
        details: errorMsg
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    console.log('📊 [RSS_INGEST] Getting RSS ingestion status...')
    
    const rssIngestionService = new RSSIngestionService()
    
    // For now, just return a status message
    // In the future, this could return statistics about RSS ingestion
    
    return NextResponse.json({
      success: true,
      message: 'RSS ingestion service is available',
      status: 'ready'
    })

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ [RSS_INGEST] Error getting RSS ingestion status:', errorMsg)
    
    return NextResponse.json(
      { 
        error: 'Failed to get RSS ingestion status',
        details: errorMsg
      },
      { status: 500 }
    )
  }
}
