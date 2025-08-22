import { getAllContent } from '@/services/content'
import { Faqs } from '@/appData/faqs'
import Faq from '@/components/faq'
import Footer from '@/components/footer'
import Hero from '@/components/hero'
import Navbar from '@/components/navbar'
import Newsletter from '@/components/newsletter'
import ContentSection from '@/components/content-section'
import FeaturedCarousel from '@/components/featured-carousel'

// Successfully deployed with YouTube Simple API: 2025-01-21T12:00:00.000Z
// 
// ✅ UPDATED: Now using simple YouTube API key approach (much better!)
// This site uses YouTube API key with curated channels (includeYouTube: true)
// No more OAuth complexity - just add YOUTUBE_API_KEY to environment variables
// The API key approach provides reliable content from specific fantasy football channels
//
export default async function Home() {
  const content = await getAllContent({
    includeYouTube: true, // ✅ Enable YouTube content using simple API key approach
    includeRSS: true, // ✅ Enable RSS content for articles
    includeSubscriptions: false, // ❌ OAuth subscriptions completely disabled
    includeNews: true, // ✅ Enable news articles
    youtubeMaxResults: 30, // Get more YouTube videos from curated channels
    rssLimit: 25, // Get more RSS articles
    subscriptionsMaxResults: 0, // Not using OAuth subscriptions
    subscriptionsDaysBack: 30, // Look back 1 month for content
    newsLimit: 40 // Get more news articles
  })

  // Get the 5 most recent items for featured carousel
  const featuredContent = content
    .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())
    .slice(0, 5)

  // Get featured content IDs for styling in the main list
  const featuredContentIds = featuredContent.map(item => item.id)

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
        <ContentSection initialContent={content} featuredContentIds={featuredContentIds} />
        <Faq items={Faqs} />
        <Newsletter />
      </main>

      <Footer />
    </>
  )
}
