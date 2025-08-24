import { Faqs } from '@/appData/faqs'
import Faq from '@/components/faq'
import Footer from '@/components/footer'
import Hero from '@/components/hero'
import Navbar from '@/components/navbar'
import Newsletter from '@/components/newsletter'
import ContentSection from '@/components/content-section'
import FeaturedCarousel from '@/components/featured-carousel'
import { connectToDatabase } from '@/lib/mongodb'
import Resource from '@/models/Resource'

export default async function Home() {
  // Fetch YouTube videos directly from database
  const connection = await connectToDatabase()
  
  let transformedVideos: Array<{
    id: string
    title: string
    shortDescription: string
    cover: string
    category: string
    publishDate: string
    source: 'youtube'
    url: string
    sourceName: string
    author: string
    viewCount?: number
    duration?: string
    tags: string[]
  }> = []
  
  if (connection) {
    const youtubeVideos = await Resource.find({
      source: 'YouTube',
      isActive: true
    })
    .sort({ pubDate: -1 })
    .limit(30)
    .lean()

    // Transform to the format expected by components
    transformedVideos = youtubeVideos.map((video: Record<string, unknown>) => ({
      id: (video._id as { toString(): string })?.toString() || '',
      title: (video.title as string) || '',
      shortDescription: ((video.description as string) || '').length > 150 
        ? ((video.description as string) || '').substring(0, 150) + '...' 
        : (video.description as string) || '',
      cover: (video.image as string) || '',
      category: (video.category as string) || '',
      publishDate: (video.pubDate as string) || '',
      source: 'youtube' as const,
      url: (video.url as string) || '',
      sourceName: (video.author as string) || '',
      author: (video.author as string) || '',
      viewCount: (video.rawFeedItem as Record<string, unknown>)?.viewCount ? parseInt((video.rawFeedItem as Record<string, unknown>).viewCount as string) : undefined,
      duration: (video.rawFeedItem as Record<string, unknown>)?.duration ? formatDuration((video.rawFeedItem as Record<string, unknown>).duration as string) : undefined,
      tags: (video.tags as string[]) || []
    }))
  }

  // Use the first 5 videos as featured content for the carousel
  const featuredContent = transformedVideos.slice(0, 5)
  const featuredContentIds = featuredContent.map(video => video.id)

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
        <FeaturedCarousel featuredContent={featuredContent} />

        <ContentSection initialContent={transformedVideos} featuredContentIds={featuredContentIds} />
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
