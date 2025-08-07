import { getAllContent } from '@/services/content'
import { Faqs } from '@/appData/faqs'
import Faq from '@/components/faq'
import Footer from '@/components/footer'
import Hero from '@/components/hero'
import Navbar from '@/components/navbar'
import Newsletter from '@/components/newsletter'
import ContentSection from '@/components/content-section'

// Last deployment test: 2025-01-07T01:30:00.000Z
export default async function Home() {
  const content = await getAllContent({
    includeYouTube: false, // ❌ Disabled - shows random videos, not subscriptions
    includeRSS: false, // Disabled - showing errors
    includeSubscriptions: true, // ✅ Only show videos from YOUR subscriptions!
    youtubeQuery: 'fantasy football 2024',
    youtubeMaxResults: 0,
    rssLimit: 0,
    subscriptionsMaxResults: 50, // Increased to get more from your subscriptions
    subscriptionsDaysBack: 14 // Look back 2 weeks for more content
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
