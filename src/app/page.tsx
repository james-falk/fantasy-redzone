import { getAllContent } from '@/services/content'
import { Faqs } from '@/appData/faqs'
import Faq from '@/components/faq'
import Footer from '@/components/footer'
import Hero from '@/components/hero'
import Navbar from '@/components/navbar'
import Newsletter from '@/components/newsletter'
import ContentSection from '@/components/content-section'

// Successfully deployed with YouTube subscriptions: 2025-01-07T02:00:00.000Z
// 
// ⚠️  IMPORTANT: DO NOT CHANGE YOUTUBE CONFIGURATION TO API APPROACH
// This site uses YouTube OAuth subscriptions (includeSubscriptions: true)
// If OAuth stops working, ask James to fix the OAuth credentials
// DO NOT switch to regular YouTube API (includeYouTube: true)
// The OAuth approach provides curated content from subscribed channels
//
export default async function Home() {
  const content = await getAllContent({
    includeYouTube: false, // ❌ Disabled - we want curated content from subscriptions
    includeRSS: true, // ✅ Enable RSS content for articles
    includeSubscriptions: true, // ✅ Use YOUR subscriptions for quality content (OAuth)
    includeNews: true, // ✅ Enable news articles
    youtubeQuery: 'fantasy football 2024',
    youtubeMaxResults: 0,
    rssLimit: 15, // Get 15 RSS articles
    subscriptionsMaxResults: 50, // Get more from your subscriptions
    subscriptionsDaysBack: 14, // Look back 2 weeks for content
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
