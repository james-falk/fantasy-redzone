import { Faqs } from '@/appData/faqs'
import Faq from '@/components/faq'
import Footer from '@/components/footer'
import Hero from '@/components/hero'
import Navbar from '@/components/navbar'
import Newsletter from '@/components/newsletter'
import ClientPageWrapper from '@/components/client-page-wrapper'
import { connectToDatabase } from '@/lib/mongodb'
import Resource from '@/models/Resource'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  console.log('🚀 [PRODUCTION DEBUG] Home page starting...')
  
  // Get current page from URL params, default to 1
  const params = await searchParams
  const currentPage = parseInt(params.page || '1')
  const itemsPerPage = 100
  const skip = (currentPage - 1) * itemsPerPage
  
  // Fetch all content (YouTube videos and RSS articles) directly from database
  const connection = await connectToDatabase()
  console.log('🔗 [PRODUCTION DEBUG] Database connection result:', connection ? 'SUCCESS' : 'FAILED')
  
  let transformedContent: Array<{
    id: string
    title: string
    shortDescription: string
    cover: string
    category: string
    publishDate: string
    source: 'youtube' | 'rss'
    url: string
    sourceName: string
    author: string
    viewCount?: number
    duration?: string
    tags: string[]
  }> = []
  
  let totalItems = 0
  let totalPages = 0
  let totalVideos = 0
  let totalNews = 0
  
  if (connection) {
    console.log('📊 [PRODUCTION DEBUG] Querying MongoDB for all content...')
    
    try {
      // Get total count for pagination
      totalItems = await Resource.countDocuments({ isActive: true })
      totalPages = Math.ceil(totalItems / itemsPerPage)
      
      // Get total counts by source type
      totalVideos = await Resource.countDocuments({ 
        isActive: true, 
        source: 'YouTube' 
      })
      totalNews = await Resource.countDocuments({ 
        isActive: true, 
        source: 'RSS' 
      })
      
      const allResources = await Resource.find({
        isActive: true
      })
      .sort({ pubDate: -1 })
      .skip(skip)
      .limit(itemsPerPage)
      .lean()

      console.log('📺 [PRODUCTION DEBUG] Found total resources:', allResources.length)
      
      const youtubeCount = allResources.filter(r => r.source === 'YouTube').length
      const rssCount = allResources.filter(r => r.source === 'RSS').length
      console.log('📺 [PRODUCTION DEBUG] YouTube videos:', youtubeCount, 'RSS articles:', rssCount)
      
      console.log('📺 [PRODUCTION DEBUG] First resource sample:', allResources[0] ? {
        id: allResources[0]._id,
        title: allResources[0].title,
        source: allResources[0].source,
        image: allResources[0].image,
        url: allResources[0].url
      } : 'No resources found')

      // Transform to the format expected by components
      transformedContent = allResources.map((resource: Record<string, unknown>) => {
        const source = (resource.source as string) || ''
        const isYouTube = source === 'YouTube'
        
        return {
          id: (resource._id as { toString(): string })?.toString() || '',
          title: (resource.title as string) || '',
          shortDescription: ((resource.description as string) || '').length > 150 
            ? ((resource.description as string) || '').substring(0, 150) + '...' 
            : (resource.description as string) || '',
          cover: (resource.image as string) || '',
          category: (resource.category as string) || '',
          publishDate: (resource.pubDate as string) || '',
          source: isYouTube ? 'youtube' as const : 'rss' as const,
          url: (resource.url as string) || '',
          sourceName: isYouTube ? (resource.author as string) || '' : (resource.rawFeedItem as Record<string, unknown>)?.sourceName as string || (resource.author as string) || '',
          author: (resource.author as string) || '',
          viewCount: isYouTube && (resource.rawFeedItem as Record<string, unknown>)?.viewCount 
            ? parseInt((resource.rawFeedItem as Record<string, unknown>).viewCount as string) 
            : undefined,
          duration: isYouTube && (resource.rawFeedItem as Record<string, unknown>)?.duration 
            ? formatDuration((resource.rawFeedItem as Record<string, unknown>).duration as string) 
            : undefined,
          tags: (resource.tags as string[]) || []
        }
      })
      
      console.log('🔄 [PRODUCTION DEBUG] Transformed content:', transformedContent.length)
      console.log('🔄 [PRODUCTION DEBUG] First transformed content:', transformedContent[0] ? {
        id: transformedContent[0].id,
        title: transformedContent[0].title,
        source: transformedContent[0].source,
        cover: transformedContent[0].cover,
        url: transformedContent[0].url
      } : 'No transformed content')
      
    } catch (error) {
      console.error('❌ [PRODUCTION DEBUG] Error fetching content:', error)
    }
  } else {
    console.log('⚠️ [PRODUCTION DEBUG] No database connection available')
  }

  // Select featured content: top 3 most-viewed videos from past week + 3 recent articles
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  
  // Get videos from the past week with view counts
  const recentVideos = transformedContent.filter(item => 
    item.source === 'youtube' && 
    item.viewCount && 
    new Date(item.publishDate) >= oneWeekAgo
  )
  
  // Sort by view count (highest first) and take top 3
  const topVideos = recentVideos
    .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
    .slice(0, 3)
  
  // Get 3 recent articles
  const recentArticles = transformedContent
    .filter(item => item.source === 'rss')
    .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())
    .slice(0, 3)
  
  // Combine videos and articles for featured content, then sort by newest first
  const featuredContent = [...topVideos, ...recentArticles]
    .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())
  const featuredContentIds = featuredContent.map(item => item.id)
  
  console.log('🎯 [PRODUCTION DEBUG] Featured content count:', featuredContent.length)
  console.log('🎯 [PRODUCTION DEBUG] Top videos from past week:', topVideos.length)
  console.log('🎯 [PRODUCTION DEBUG] Recent articles:', recentArticles.length)
  console.log('🎯 [PRODUCTION DEBUG] Featured content IDs:', featuredContentIds)

  return (
    <>
      <header>
        <Navbar />
        <Hero
          title={['Fantasy', 'Red Zone']}
          description="Your ultimate destination for fantasy football content, analysis, and insights. Discover the latest videos, articles, and expert analysis to dominate your fantasy leagues!"
        />
      </header>

      <main>
        <ClientPageWrapper 
          initialContent={transformedContent} 
          featuredContentIds={featuredContentIds}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          totalVideos={totalVideos}
          totalNews={totalNews}
        />
        <Faq items={Faqs} />
        <Newsletter />
      </main>

      <Footer />
    </>
  )
}

function formatDuration(duration: string): string {
  // YouTube duration is in ISO 8601 format (PT1H25M1S)
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return duration

  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }
}
