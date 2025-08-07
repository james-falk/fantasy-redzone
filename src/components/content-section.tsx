'use client'

import { useState, useCallback } from 'react'
import { Content } from '@/types/content'
import ProductList from './product-list'
import ContentFilterComponent from './content-filter'
import SectionHeading from './section-heading'

interface ContentSectionProps {
  initialContent: Content[]
}

export default function ContentSection({ initialContent }: ContentSectionProps) {
  const [filteredContent, setFilteredContent] = useState<Content[]>(initialContent)

  const handleFilterChange = useCallback((filtered: Content[]) => {
    setFilteredContent(filtered)
  }, [])

  return (
    <section className="max-w-7xl mx-auto px-4 my-16">
      <SectionHeading
        title={['Latest Fantasy', 'Content']}
        subtitle="Stay ahead of the game with fresh fantasy football content from top creators, analysts, and news sources. Updated daily with the latest insights, rankings, and strategies."
      />
      
      <ContentFilterComponent
        content={initialContent}
        onFilterChange={handleFilterChange}
      />
      
      {filteredContent.length === 0 ? (
        <div className="text-center py-16 redzone-card rounded-xl mx-4">
          <div className="text-red-400 text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-white mb-2">No content found</h3>
          <p className="text-gray-300">Try adjusting your filters or search terms to find what you&apos;re looking for.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 p-4 redzone-card rounded-lg">
            <p className="text-sm text-gray-300 font-semibold mb-2 sm:mb-0">
              Showing <span className="text-red-400 font-bold">{filteredContent.length}</span> of <span className="text-white">{initialContent.length}</span> items
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-300">
              <span className="flex items-center gap-2 font-medium">
                <span className="w-3 h-3 bg-red-500 rounded-full shadow-lg"></span>
                Videos: <span className="text-white font-bold">{filteredContent.filter(item => item.source === 'youtube').length}</span>
              </span>
              <span className="flex items-center gap-2 font-medium">
                <span className="w-3 h-3 bg-green-500 rounded-full shadow-lg"></span>
                Articles: <span className="text-white font-bold">{filteredContent.filter(item => item.source === 'rss').length}</span>
              </span>
              <span className="flex items-center gap-2 font-medium">
                <span className="w-3 h-3 bg-blue-500 rounded-full shadow-lg"></span>
                Courses: <span className="text-white font-bold">{filteredContent.filter(item => item.source === 'static').length}</span>
              </span>
            </div>
          </div>
          
          <ProductList products={filteredContent} />
        </>
      )}
    </section>
  )
} 