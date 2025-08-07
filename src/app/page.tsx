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
    includeYouTube: false, // ❌ Disabled - we want curated content from subscriptions
    includeRSS: false, // Keep disabled until RSS is fixed
    includeSubscriptions: true, // ✅ Use YOUR subscriptions for quality content
    youtubeQuery: 'fantasy football 2024',
    youtubeMaxResults: 0,
    rssLimit: 0,
    subscriptionsMaxResults: 50, // Get more from your subscriptions
    subscriptionsDaysBack: 14 // Look back 2 weeks for content
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
