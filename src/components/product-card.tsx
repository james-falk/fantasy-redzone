import { FC } from 'react'
import { formatDate } from '../utils/functions'
import Link from 'next/link'
import { Content, YouTubeContent, RSSContent } from '@/types/content'

interface ProductCardProps {
  post: Content
  isFeatured?: boolean
}

const ProductCard: FC<ProductCardProps> = ({ post, isFeatured = false }) => {
  const { title, slug, cover, publishDate, category, source } = post

  // Determine the link based on content source
  const getContentLink = (): string => {
    switch (source) {
      case 'youtube':
        return (post as YouTubeContent).url
      case 'rss':
        return (post as RSSContent).url
      case 'static':
      default:
        return `/${slug}`
    }
  }

  // Get source-specific badge color
  const getSourceBadge = () => {
    switch (source) {
      case 'youtube':
        return { bg: 'bg-red-600/20', text: 'text-red-400', icon: '📺', border: 'border-red-600/30', label: 'VIDEO' }
      case 'rss':
        return { bg: 'bg-green-600/20', text: 'text-green-400', icon: '📰', border: 'border-green-600/30', label: 'NEWS' }
      case 'news':
        return { bg: 'bg-green-600/20', text: 'text-green-400', icon: '📰', border: 'border-green-600/30', label: 'NEWS' }
      case 'static':
      default:
        return { bg: 'bg-blue-600/20', text: 'text-blue-400', icon: '🎓', border: 'border-blue-600/30', label: 'COURSE' }
    }
  }

  // Get additional metadata
  const getMetadata = (): string => {
    switch (source) {
      case 'youtube':
        const ytContent = post as YouTubeContent
        return `${ytContent.channelTitle} • ${ytContent.viewCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')} views`
      case 'rss':
        const rssContent = post as RSSContent
        return rssContent.sourceName || rssContent.author || 'RSS Article'
      case 'news':
        const newsContent = post as { sourceName?: string } // NewsArticle type
        return newsContent.sourceName || 'News'
      case 'static':
      default:
        return 'Course'
    }
  }

  // Get source attribution tag
  const getSourceTag = (): { label: string, color: string } | null => {
    switch (source) {
      case 'youtube':
        const ytContent = post as YouTubeContent
        return { 
          label: ytContent.channelTitle || 'YouTube', 
          color: 'bg-red-100 text-red-800 border-red-200' 
        }
      case 'rss':
        const rssContent = post as RSSContent
        return rssContent.sourceName ? { 
          label: rssContent.sourceName, 
          color: 'bg-green-100 text-green-800 border-green-200' 
        } : null
      case 'news':
        const newsContent = post as { sourceName?: string } // NewsArticle type
        return newsContent.sourceName ? { 
          label: newsContent.sourceName, 
          color: 'bg-blue-100 text-blue-800 border-blue-200' 
        } : null
      default:
        return null
    }
  }

  const sourceBadge = getSourceBadge()
  const isExternal = source !== 'static'

  return (
    <Link 
      href={getContentLink()} 
      className="no-underline group" 
      target={isExternal ? '_blank' : '_self'}
      rel={isExternal ? 'noopener noreferrer' : ''}
    >
      <div
        key={post.id}
        className={`relative flex transform flex-col gap-4 transition-all duration-300 hover:scale-105 redzone-card rounded-xl p-5 shadow-lg hover:shadow-2xl border ${
          isFeatured 
            ? 'border-yellow-500/60 hover:border-yellow-400/80 group-hover:shadow-yellow-500/30 group-hover:shadow-2xl' 
            : 'hover:border-red-600/40 group-hover:redzone-glow'
        }`}
      >
        {/* Featured Star Indicator */}
        {isFeatured && (
          <div className="absolute top-3 left-3 z-10">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-500 to-yellow-600 text-black shadow-lg border border-yellow-400/50">
              ⭐ FEATURED
            </span>
          </div>
        )}
        
        <figure className="relative h-48 w-full overflow-hidden">
          {cover ? (
            <img
              src={cover}
              alt={title}
              className="h-full w-full rounded-xl bg-gray-800 object-cover transition-transform duration-300 group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="text-4xl mb-2">{sourceBadge.icon}</div>
                <div className="text-sm font-medium">{sourceBadge.label}</div>
              </div>
            </div>
          )}
          {/* Source indicator overlay */}
          <div className="absolute top-3 right-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-sm ${sourceBadge.bg} ${sourceBadge.text} ${sourceBadge.border}`}>
              <span className="mr-1">{sourceBadge.icon}</span>
              {sourceBadge.label}
            </span>
          </div>
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl"></div>
        </figure>

        <div className="mt-1 flex items-center gap-3 flex-wrap">
          <span className="w-fit rounded-lg redzone-gradient-intense px-3 py-1 text-sm font-bold text-white shadow-lg">
            {category}
          </span>
          {/* Source attribution tag */}
          {(() => {
            const sourceTag = getSourceTag()
            return sourceTag ? (
              <span className={`w-fit rounded-lg px-2 py-1 text-xs font-medium border ${sourceTag.color}`}>
                {sourceTag.label}
              </span>
            ) : null
          })()}
          <p className="text-sm font-semibold text-gray-400">
            {formatDate(publishDate)}
          </p>
        </div>

        {/* Additional metadata */}
        <p className="text-xs text-gray-400 font-medium">
          {getMetadata()}
        </p>

        <h3 className={`text-white mb-2 text-xl font-bold transition-colors duration-300 line-clamp-2 ${
          isFeatured ? 'group-hover:text-yellow-400' : 'group-hover:text-red-400'
        }`}>
          {title}
        </h3>

        {/* Content preview */}
        <p className="text-sm text-gray-300 line-clamp-3 leading-relaxed">
          {post.shortDescription}
        </p>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {post.tags.slice(0, 3).map((tag) => (
              <span 
                key={tag}
                className={`px-2 py-1 bg-white/10 text-gray-300 text-xs rounded-md border border-white/20 transition-colors ${
                  isFeatured 
                    ? 'hover:bg-yellow-500/20 hover:border-yellow-500/30' 
                    : 'hover:bg-red-600/20 hover:border-red-600/30'
                }`}
              >
                {tag}
              </span>
            ))}
            {post.tags.length > 3 && (
              <span className={`px-2 py-1 text-xs rounded-md font-semibold ${
                isFeatured 
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                  : 'bg-red-600/20 text-red-400 border border-red-600/30'
              }`}>
                +{post.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}

export default ProductCard
