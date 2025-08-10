import { getAllContent } from '@/services/content'
import { Faqs } from '@/appData/faqs'
import Faq from '@/components/faq'
import Footer from '@/components/footer'
import Hero from '@/components/hero'
import Navbar from '@/components/navbar'
import Newsletter from '@/components/newsletter'
import ContentSection from '@/components/content-section'

// Successfully deployed with YouTube subscriptions: 2025-01-07T02:00:00.000Z
export default async function Home() {
  const content = await getAllContent({
    includeYouTube: true, // ✅ Enable regular YouTube search (works without OAuth)
    includeRSS: true, // ✅ Enable RSS content for articles
    includeSubscriptions: false, // ❌ Disabled - requires OAuth setup
    includeNews: true, // ✅ Enable news articles
    youtubeQuery: 'fantasy football 2024 news analysis',
    youtubeMaxResults: 25, // Get 25 YouTube videos
    rssLimit: 15, // Get 15 RSS articles
    subscriptionsMaxResults: 0, // Disabled
    subscriptionsDaysBack: 14,
    newsLimit: 20 // Get 20 news articles
  })

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
        <ContentSection initialContent={content} />
        <Faq items={Faqs} />
        <Newsletter />
      </main>

      <Footer />
    </>
  )
}
