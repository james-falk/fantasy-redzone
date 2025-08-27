import { connectToDatabase } from '@/lib/mongodb'
import Resource from '@/models/Resource'
import Link from 'next/link'
import { PlayCircle, FileText, TrendingUp } from 'lucide-react'

export default async function SourcesPage() {
  // Connect to database
  const connection = await connectToDatabase()
  if (!connection) {
    throw new Error('Failed to connect to database')
  }

  // Get all unique sources with their content counts
  const sources = await Resource.aggregate([
    {
      $match: { isActive: true }
    },
    {
      $group: {
        _id: '$rawFeedItem.sourceName',
        totalCount: { $sum: 1 },
        youtubeCount: {
          $sum: {
            $cond: [{ $eq: ['$source', 'YouTube'] }, 1, 0]
          }
        },
        rssCount: {
          $sum: {
            $cond: [{ $eq: ['$source', 'RSS'] }, 1, 0]
          }
        },
        latestContent: { $max: '$publishDate' },
        categories: { $addToSet: '$category' }
      }
    },
    {
      $sort: { totalCount: -1 }
    }
  ])

  // Get overall statistics
  const totalContent = await Resource.countDocuments({ isActive: true })
  const totalVideos = await Resource.countDocuments({ source: 'YouTube', isActive: true })
  const totalArticles = await Resource.countDocuments({ source: 'RSS', isActive: true })

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-900/50 to-red-800/50 border-b border-red-600/20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
              Content Sources
            </h1>
            <p className="text-xl text-gray-300 mb-6">
              Browse all content sources and discover fantasy football insights
            </p>
            
            {/* Overall Statistics */}
            <div className="flex justify-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-red-400" />
                <span className="text-white font-bold">{totalVideos}</span>
                <span className="text-gray-300">Videos</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-400" />
                <span className="text-white font-bold">{totalArticles}</span>
                <span className="text-gray-300">Articles</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                <span className="text-white font-bold">{totalContent}</span>
                <span className="text-gray-300">Total</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sources Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {sources.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-red-400 text-6xl mb-4">📰</div>
            <h3 className="text-xl font-semibold text-white mb-2">No sources found</h3>
            <p className="text-gray-300">No content sources are currently available.</p>
          </div>
        ) : (
          <>
            {/* Sources Count */}
            <div className="mb-8 p-4 bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-300">
                Showing <span className="text-red-400 font-bold">{sources.length}</span> content sources
              </p>
            </div>

            {/* Sources Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sources.map((source) => (
                                 <Link 
                   key={source._id} 
                   href={`/source/${encodeURIComponent(source._id)}`}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="group"
                 >
                  <div className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 transition-all duration-300 hover:scale-105 border border-gray-700 hover:border-gray-600">
                    {/* Source Name */}
                    <h3 className="text-xl font-bold text-white mb-4 group-hover:text-red-400 transition-colors duration-300">
                      {source._id}
                    </h3>
                    
                    {/* Statistics */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <PlayCircle className="w-4 h-4 text-red-400" />
                          <span className="text-gray-300 text-sm">Videos</span>
                        </div>
                        <span className="text-white font-bold">{source.youtubeCount}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-green-400" />
                          <span className="text-gray-300 text-sm">Articles</span>
                        </div>
                        <span className="text-white font-bold">{source.rssCount}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-blue-400" />
                          <span className="text-gray-300 text-sm">Total</span>
                        </div>
                        <span className="text-white font-bold">{source.totalCount}</span>
                      </div>
                    </div>
                    
                    {/* Categories */}
                    {source.categories && source.categories.length > 0 && (
                      <div className="mt-4">
                        <p className="text-gray-400 text-xs mb-2">Categories:</p>
                        <div className="flex flex-wrap gap-1">
                          {source.categories.slice(0, 3).map((category: string) => (
                            <span 
                              key={category}
                              className="bg-red-600/20 text-red-400 px-2 py-1 rounded-full text-xs"
                            >
                              {category}
                            </span>
                          ))}
                          {source.categories.length > 3 && (
                            <span className="text-gray-500 text-xs">
                              +{source.categories.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Latest Content */}
                    {source.latestContent && (
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <p className="text-gray-400 text-xs">
                          Latest: {new Date(source.latestContent).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
