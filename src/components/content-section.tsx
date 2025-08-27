'use client'

import { useState, useCallback } from 'react'
import ProductList from './product-list'
import ContentFilterComponent from './content-filter'
import SectionHeading from './section-heading'

interface ContentSectionProps {
  initialContent: Array<{
    id: string
    title: string
    shortDescription: string
    cover: string
    category: string
    publishDate: string
    source: 'youtube' | 'rss' | 'news' | 'static'
    url?: string
    sourceName?: string
    author?: string
    viewCount?: number
    duration?: string
    tags: string[]
  }>
  featuredContentIds: string[]
  currentPage?: number
  totalPages?: number
  totalItems?: number
  totalVideos?: number
  totalNews?: number
}

export default function ContentSection({ 
  initialContent, 
  featuredContentIds,
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  totalVideos = 0,
  totalNews = 0
}: ContentSectionProps) {
  const [filteredContent, setFilteredContent] = useState(initialContent)

  const handleFilterChange = useCallback((filtered: typeof initialContent) => {
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
               Showing <span className="text-red-400 font-bold">{filteredContent.length}</span> of <span className="text-white">{totalItems}</span> items
             </p>
             <div className="flex items-center gap-6 text-sm text-gray-300">
               <span className="flex items-center gap-2 font-medium">
                 <span className="w-3 h-3 bg-red-500 rounded-full shadow-lg"></span>
                 Videos: <span className="text-white font-bold">{totalVideos}</span>
               </span>
               <span className="flex items-center gap-2 font-medium">
                 <span className="w-3 h-3 bg-green-500 rounded-full shadow-lg"></span>
                 News: <span className="text-white font-bold">{totalNews}</span>
               </span>
             </div>
           </div>
          
          <ProductList products={filteredContent} featuredContentIds={featuredContentIds} />
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              {/* Previous Page */}
              {currentPage > 1 && (
                <a
                  href={`/?page=${currentPage - 1}`}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
                >
                  ← Previous
                </a>
              )}
              
              {/* Page Numbers */}
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  
                  return (
                    <a
                      key={pageNum}
                      href={`/?page=${pageNum}`}
                      className={`px-3 py-2 rounded-lg transition-colors duration-200 ${
                        pageNum === currentPage
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-800 hover:bg-gray-700 text-white'
                      }`}
                    >
                      {pageNum}
                    </a>
                  )
                })}
              </div>
              
              {/* Next Page */}
              {currentPage < totalPages && (
                <a
                  href={`/?page=${currentPage + 1}`}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
                >
                  Next →
                </a>
              )}
            </div>
          )}
          
          {/* Page Info */}
          {totalPages > 1 && (
            <div className="text-center mt-4 text-sm text-gray-400">
              Page {currentPage} of {totalPages} • Showing {initialContent.length} of {totalItems} total items
            </div>
          )}
        </>
      )}
    </section>
  )
}
