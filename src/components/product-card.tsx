'use client'

import { useState } from 'react'
import Image from 'next/image'

interface ProductCardProps {
  post: {
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
  }
  featured?: boolean
}

export default function ProductCard({ post, featured = false }: ProductCardProps) {
  const [imageError, setImageError] = useState(false)

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const sourceBadge = getSourceBadge(post.source)
  const isExternal = post.source !== 'static'

  return (
    <div className={`group relative bg-gray-900 rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:scale-[1.02] ${
      featured 
        ? 'border-2 border-yellow-500/70 hover:shadow-yellow-500/30 hover:border-yellow-400/80' 
        : 'border border-gray-700 hover:border-gray-600'
    }`}>
      {/* Featured Badge */}
      {featured && (
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

      {/* Image Section (60-70% of card height) */}
      <div className="relative h-48 lg:h-52">
        {!imageError ? (
          <Image
            src={post.cover}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
            <div className="text-center">
              <div className="text-sm text-gray-400">VIDEO</div>
            </div>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Metadata Row */}
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-red-600 text-white px-2 py-1 rounded-full text-xs font-medium">
            {post.category}
          </span>
          <span className="bg-green-600 text-white px-2 py-1 rounded-full text-xs font-medium">
            {post.sourceName || 'Unknown Source'}
          </span>
          <span className="text-gray-400 text-xs ml-auto">
            {formatDate(post.publishDate)}
          </span>
        </div>

        {/* Source URL */}
        <div className="text-gray-400 text-sm mb-2">
          {post.sourceName || 'Unknown Source'}
        </div>

        {/* Headline */}
        <h3 className="font-bold text-white text-base mb-2 line-clamp-2 group-hover:text-yellow-400 transition-colors duration-300">
          {post.title}
        </h3>

        {/* Description */}
        <p className="text-gray-300 text-sm line-clamp-3 group-hover:text-gray-200 transition-colors duration-300">
          {post.shortDescription}
        </p>

        {/* Additional Metadata */}
        <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            {post.author && (
              <span>By {post.author}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {post.viewCount && (
              <span>{post.viewCount.toLocaleString()} views</span>
            )}
            {post.duration && (
              <span>{post.duration}</span>
            )}
          </div>
        </div>
      </div>

      {/* Click Overlay */}
      <div 
        className="absolute inset-0 cursor-pointer"
        onClick={() => {
          if (post.url) {
            window.open(post.url, isExternal ? '_blank' : '_self')
          }
        }}
      />
    </div>
  )
}
