import { connectToDatabase } from '@/lib/mongodb'
import Resource from '@/models/Resource'
import ProductCard from '@/components/product-card'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface SourcePageProps {
  params: Promise<{
    sourceName: string
  }>
}

export default async function SourcePage({ params }: SourcePageProps) {
  const { sourceName } = await params
  
  // Decode the source name from URL
  const decodedSourceName = decodeURIComponent(sourceName)
  
  // Connect to database
  const connection = await connectToDatabase()
  if (!connection) {
    throw new Error('Failed to connect to database')
  }

  // Get all content from this specific source with multiple fallback strategies
  let sourceContent = await Resource.find({
    'rawFeedItem.sourceName': decodedSourceName,
    isActive: true
  })
  .sort({ publishDate: -1 })
  .lean()

  // If no content found, try alternative field names
  if (!sourceContent || sourceContent.length === 0) {
    sourceContent = await Resource.find({
      $or: [
        { 'rawFeedItem.sourceName': decodedSourceName },
        { sourceName: decodedSourceName },
        { author: decodedSourceName }
      ],
      isActive: true
    })
    .sort({ publishDate: -1 })
    .lean()
  }

  // If still no content, try case-insensitive search
  if (!sourceContent || sourceContent.length === 0) {
    const regex = new RegExp(`^${decodedSourceName}$`, 'i')
    sourceContent = await Resource.find({
      $or: [
        { 'rawFeedItem.sourceName': { $regex: regex } },
        { sourceName: { $regex: regex } },
        { author: { $regex: regex } }
      ],
      isActive: true
    })
    .sort({ publishDate: -1 })
    .lean()
  }

  if (!sourceContent || sourceContent.length === 0) {
    console.log(`No content found for source: ${decodedSourceName}`)
    notFound()
  }

  // Transform content to match ProductCard interface
  const transformedContent = sourceContent.map((item: Record<string, unknown>) => ({
    id: (item._id as { toString(): string }).toString(),
    title: item.title as string,
    shortDescription: item.description as string,
    cover: (item.image as string) || '/placeholder-image.jpg',
    category: (item.category as string) || 'Fantasy Football',
    publishDate: (item.publishDate || item.createdAt) as string,
    source: (item.source === 'YouTube' ? 'youtube' : 'rss') as 'youtube' | 'rss' | 'news' | 'static',
    url: item.url as string,
    sourceName: (item.rawFeedItem?.sourceName || item.author) as string,
    author: item.author as string,
    viewCount: item.rawFeedItem?.viewCount ? parseInt(item.rawFeedItem.viewCount as string) : undefined,
    duration: item.rawFeedItem?.duration as string,
    tags: (item.tags as string[]) || []
  }))

  // Get source statistics
  const youtubeCount = sourceContent.filter((item: Record<string, unknown>) => item.source === 'YouTube').length
  const rssCount = sourceContent.filter((item: Record<string, unknown>) => item.source === 'RSS').length
  const totalCount = sourceContent.length

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-900/50 to-red-800/50 border-b border-red-600/20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Home Button */}
          <div className="mb-6">
            <Link 
              href="/"
              className="inline-flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
            >
              ← Home
            </Link>
          </div>
          
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
              {decodedSourceName}
            </h1>
            <p className="text-xl text-gray-300 mb-6">
              All content from {decodedSourceName}
            </p>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {transformedContent.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-red-400 text-6xl mb-4">📰</div>
            <h3 className="text-xl font-semibold text-white mb-2">No content found</h3>
            <p className="text-gray-300">No content available from {decodedSourceName}.</p>
          </div>
        ) : (
          <>
            {/* Content Count */}
            <div className="mb-8 p-4 bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-300">
                Showing <span className="text-red-400 font-bold">{transformedContent.length}</span> items from {decodedSourceName}
              </p>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {transformedContent.map((item) => (
                <ProductCard key={item.id} post={item} hideSourceBadge={true} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Generate static params for known sources
export async function generateStaticParams() {
  try {
    const connection = await connectToDatabase()
    if (!connection) {
      console.log('Failed to connect to database for static params')
      return []
    }

    // Get all unique source names with better error handling
    const sources = await Resource.distinct('rawFeedItem.sourceName')
    console.log('Found sources for static generation:', sources)
    
    return sources
      .filter(sourceName => sourceName && sourceName.trim() !== '')
      .map((sourceName) => ({
        sourceName: encodeURIComponent(sourceName)
      }))
  } catch (error) {
    console.error('Error in generateStaticParams:', error)
    return []
  }
}
