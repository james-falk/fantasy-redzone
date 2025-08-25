'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'

interface FeaturedCarouselProps {
  featuredContent: Array<{
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
  }>
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

  const getContentLink = (content: FeaturedCarouselProps['featuredContent'][0]): string => {
    return content.url || '#'
  }

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'youtube':
        return { label: 'VIDEO', bg: 'bg-red-600', text: 'text-white' }
      case 'rss':
      case 'news':
        return { label: 'NEWS', bg: 'bg-green-600', text: 'text-white' }
      case 'static':
      default:
        return { label: 'COURSE', bg: 'bg-blue-600', text: 'text-white' }
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
                    <div className={`relative bg-gray-900 rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:scale-[1.02] ${
                      isCurrent 
                        ? 'border-2 border-yellow-500/70 hover:shadow-yellow-500/30 hover:border-yellow-400/80' 
                        : 'border border-gray-700 hover:border-gray-600'
                    }`}>
                      {/* Featured Badge - Only show on current item */}
                      {isCurrent && (
                        <div className="absolute top-3 left-3 z-10">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-500 to-yellow-600 text-black shadow-lg">
                            FEATURED
                          </span>
                        </div>
                      )}

                      {/* Source Badge */}
                      <div className="absolute top-3 right-3 z-10">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${sourceBadge.bg} ${sourceBadge.text}`}>
                          {sourceBadge.label}
                        </span>
                      </div>

                      {/* Content Image */}
                      <div className={`relative ${isCurrent ? 'h-48 lg:h-56' : 'h-40 lg:h-44'} ${content.source === 'rss' ? 'bg-gray-800' : ''}`}>
                        <Image
                          src={content.cover}
                          alt={content.title}
                          fill
                          className={content.source === 'rss' ? 'object-contain' : 'object-cover'}
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>

                      {/* Content Info - Simplified thumbnail layout */}
                      <div className="p-4">
                        <h3 className={`font-bold text-white transition-colors duration-300 line-clamp-2 ${
                          isCurrent 
                            ? 'text-base lg:text-lg group-hover:text-yellow-400' 
                            : 'text-sm group-hover:text-yellow-400'
                        }`}>
                          {content.title}
                        </h3>
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
