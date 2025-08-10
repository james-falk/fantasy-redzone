import { FC } from 'react'
import { formatDate } from '../utils/functions'
import Link from 'next/link'
import { Content, YouTubeContent, RSSContent } from '@/types/content'

interface ProductCardProps {
  post: Content
}

const ProductCard: FC<ProductCardProps> = ({ post }) => {
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
        return `${ytContent.channelTitle} • ${ytContent.viewCount.toLocaleString()} views`
      case 'rss':
        const rssContent = post as RSSContent
        return rssContent.author || 'Article'
      case 'static':
      default:
        return 'Course'
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
        className="flex transform flex-col gap-4 transition-all duration-300 hover:scale-105 redzone-card rounded-xl p-5 shadow-lg hover:shadow-2xl border hover:border-red-600/40 group-hover:redzone-glow"
      >
        <figure className="relative h-48 w-full overflow-hidden">
          <img
            src={cover}
            alt={title}
            className="h-full w-full rounded-xl bg-gray-800 object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
          />
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
          <p className="text-sm font-semibold text-gray-400">
            {formatDate(publishDate)}
          </p>
        </div>

        {/* Additional metadata */}
        <p className="text-xs text-gray-400 font-medium">
          {getMetadata()}
        </p>

        <h3 className="text-white group-hover:text-red-400 mb-2 text-xl font-bold transition-colors duration-300 line-clamp-2">
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
                className="px-2 py-1 bg-white/10 text-gray-300 text-xs rounded-md border border-white/20 hover:bg-red-600/20 hover:border-red-600/30 transition-colors"
              >
                {tag}
              </span>
            ))}
            {post.tags.length > 3 && (
              <span className="px-2 py-1 bg-red-600/20 text-red-400 text-xs rounded-md border border-red-600/30 font-semibold">
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
