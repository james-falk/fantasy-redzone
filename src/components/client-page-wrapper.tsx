'use client'

import { useState, useCallback } from 'react'
import RefreshIndicator from './refresh-indicator'
import ContentSection from './content-section'
import FeaturedCarousel from './featured-carousel'

interface ClientPageWrapperProps {
  initialContent: Array<{
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
  }>
  featuredContentIds: string[]
}

export default function ClientPageWrapper({ 
  initialContent, 
  featuredContentIds 
}: ClientPageWrapperProps) {
  const [content, setContent] = useState(initialContent)
  const [isRefreshing, setIsRefreshing] = useState(false)

  /**
   * Handles refreshing the content when new data is available
   */
  const handleRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true)
      console.log('🔄 [CLIENT] Refreshing page content...')
      
      // Reload the page to get fresh data
      window.location.reload()
      
    } catch (error) {
      console.error('❌ [CLIENT] Error refreshing content:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  // Use the first 5 videos as featured content for the carousel
  const featuredContent = content.slice(0, 5)

  return (
    <>
      {/* Refresh Indicator */}
      <div className="container mx-auto px-4 py-2">
        <RefreshIndicator 
          onRefresh={handleRefresh}
          pollingInterval={5 * 60 * 60 * 1000} // 5 hours
          showStatus={false}
          className="mb-4"
        />
      </div>

      {/* Main Content */}
      <main>
        <FeaturedCarousel featuredContent={featuredContent} />
        <ContentSection 
          initialContent={content} 
          featuredContentIds={featuredContentIds} 
        />
      </main>

      {/* Loading Overlay */}
      {isRefreshing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="text-lg font-medium">Refreshing content...</span>
          </div>
        </div>
      )}
    </>
  )
}
