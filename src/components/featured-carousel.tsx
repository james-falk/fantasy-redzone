'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Content, YouTubeContent, RSSContent } from '@/types/content'
import { NewsArticle } from '@/types/news'
import { formatDate } from '@/utils/functions'

interface FeaturedCarouselProps {
  featuredContent: Content[]
}

export default function FeaturedCarousel({ featuredContent }: FeaturedCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isClient, setIsClient] = useState(false)

  // Ensure client-side rendering for interactive features
  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!featuredContent || featuredContent.length === 0) {
    return null
  }

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === featuredContent.length - 1 ? 0 : prevIndex + 1
    )
  }

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? featuredContent.length - 1 : prevIndex - 1
    )
  }

  const getContentLink = (content: Content): string => {
    switch (content.source) {
      case 'youtube':
        return (content as YouTubeContent).url
      case 'rss':
        return (content as RSSContent).url
      case 'news':
        return (content as NewsArticle).url
      case 'static':
      default:
        return `/${content.slug}`
    }
  }

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'youtube':
        return { icon: '📺', label: 'VIDEO', bg: 'bg-red-600/30', text: 'text-red-300', border: 'border-red-500/50' }
      case 'rss':
      case 'news':
        return { icon: '📰', label: 'NEWS', bg: 'bg-green-600/30', text: 'text-green-300', border: 'border-green-500/50' }
      case 'static':
      default:
        return { icon: '🎓', label: 'COURSE', bg: 'bg-blue-600/30', text: 'text-blue-300', border: 'border-blue-500/50' }
    }
  }

  return (
    <section className="max-w-7xl mx-auto px-4 mb-12">
      {/* Featured Section Title */}
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-white mb-2">
          <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent">
            Featured Content
          </span>
        </h2>
        <p className="text-gray-300 text-lg">
          Hand-picked fantasy football insights and analysis
        </p>
      </div>

      {/* Carousel Container */}
      <div className="relative">
        {/* Navigation Arrows */}
        {/* Navigation Buttons - Only show on client */}
        {isClient && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
              aria-label="Previous featured content"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
              aria-label="Next featured content"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Carousel Track */}
        <div className="relative">
          <div className="flex justify-center items-center gap-4 lg:gap-6">
            {/* Show exactly 3 items */}
            {[0, 1, 2].map((position) => {
              // Calculate the actual content index for this position
              const actualIndex = (currentIndex - 1 + position + featuredContent.length) % featuredContent.length
              const content = featuredContent[actualIndex]
              const sourceBadge = getSourceBadge(content.source)
              const isExternal = content.source !== 'static'
              const isCurrent = position === 1 // Middle position is current

              return (
                <div 
                  key={`${content.id}-${position}`}
                  className={`transition-all duration-500 ${
                    isCurrent 
                      ? 'w-full max-w-md scale-100 opacity-100 z-20' 
                      : 'w-80 scale-85 opacity-60 z-10'
                  }`}
                >
                  <div
                    onClick={isClient ? () => {
                      if (isCurrent) {
                        window.open(getContentLink(content), isExternal ? '_blank' : '_self')
                      } else if (position === 0) {
                        // Clicked left item, go to previous
                        prevSlide()
                      } else if (position === 2) {
                        // Clicked right item, go to next
                        nextSlide()
                      }
                    } : undefined}
                    className={`block group ${isClient ? 'cursor-pointer' : ''}`}
                  >
                    <div className={`relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 hover:scale-[1.02] ${
                      isCurrent 
                        ? 'border-2 border-yellow-500/70 hover:shadow-yellow-500/30 hover:border-yellow-400/80' 
                        : 'border border-gray-600/50 hover:border-yellow-500/50'
                    }`}>
                      {/* Featured Badge - Only show on current item */}
                      {isCurrent && (
                        <div className="absolute top-4 left-4 z-10">
                          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-yellow-500 to-yellow-600 text-black shadow-lg">
                            ⭐ FEATURED
                          </span>
                        </div>
                      )}

                      {/* Source Badge */}
                      <div className="absolute top-4 right-4 z-10">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-sm ${sourceBadge.bg} ${sourceBadge.text} ${sourceBadge.border}`}>
                          <span className="mr-1">{sourceBadge.icon}</span>
                          {sourceBadge.label}
                        </span>
                      </div>

                      {/* Content Image */}
                      <div className={`relative ${isCurrent ? 'h-80 lg:h-96' : 'h-64 lg:h-72'}`}>
                        <img
                          src={content.cover}
                          alt={content.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                      </div>

                      {/* Content Info - More detailed on current item */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6 text-white">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`${
                            isCurrent 
                              ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black' 
                              : 'bg-gray-700 text-gray-300'
                          } px-2 py-1 rounded-lg text-xs font-bold`}>
                            {content.category}
                          </span>
                          {isCurrent && (
                            <span className="text-xs text-gray-300 font-medium">
                              {formatDate(content.publishDate)}
                            </span>
                          )}
                        </div>
                        
                        <h3 className={`font-bold mb-1 transition-colors duration-300 line-clamp-2 ${
                          isCurrent 
                            ? 'text-xl lg:text-2xl group-hover:text-yellow-400' 
                            : 'text-base lg:text-lg group-hover:text-yellow-400'
                        }`}>
                          {content.title}
                        </h3>
                        
                        {isCurrent && (
                          <p className="text-gray-300 text-sm line-clamp-2 group-hover:text-gray-200 transition-colors duration-300">
                            {content.shortDescription}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Carousel Indicators */}
        <div className="flex justify-center mt-6 space-x-2">
          {featuredContent.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 scale-125 shadow-lg'
                  : 'bg-gray-600 hover:bg-gray-500'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}