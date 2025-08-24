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
  await connectToDatabase()
  
  const youtubeVideos = await Resource.find({
    source: 'YouTube',
    isActive: true
  })
  .sort({ pubDate: -1 })
  .limit(30)
  .lean()

  // Transform to the format expected by components
  const transformedVideos = youtubeVideos.map((video: any) => ({
    id: video._id.toString(),
    title: video.title,
    shortDescription: video.description.length > 150 
      ? video.description.substring(0, 150) + '...' 
      : video.description,
    cover: video.image,
    category: video.category,
    publishDate: video.pubDate,
    source: 'youtube' as const,
    url: video.url,
    sourceName: video.author,
    author: video.author,
    viewCount: video.rawFeedItem?.viewCount ? parseInt(video.rawFeedItem.viewCount) : undefined,
    duration: video.rawFeedItem?.duration ? formatDuration(video.rawFeedItem.duration) : undefined,
    tags: video.tags || []
  }))

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
