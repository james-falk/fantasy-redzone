'use client'

import React, { useState, useMemo } from 'react'
import { fantasySitesData } from '@/data/fantasy-sites'

const RankingsContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<'rank' | 'name'>('rank')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const sitesPerPage = 25

  // Sort sites
  const sortedSites = useMemo(() => {
    const sorted = [...fantasySitesData].sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'rank':
          comparison = a.rank - b.rank
          break
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })
    return sorted
  }, [sortBy, sortOrder])

  // Pagination
  const totalPages = Math.ceil(sortedSites.length / sitesPerPage)
  const startIndex = (currentPage - 1) * sitesPerPage
  const endIndex = startIndex + sitesPerPage
  const currentSites = sortedSites.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <section className="max-w-7xl mx-auto px-4 my-16">
      {/* Controls */}
      <div className="redzone-card rounded-lg p-6 mb-8">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as 'rank' | 'name')
                  setCurrentPage(1)
                }}
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="rank">Rank</option>
                <option value="name">Name</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Order
              </label>
              <select
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value as 'asc' | 'desc')
                  setCurrentPage(1)
                }}
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 p-4 redzone-card rounded-lg">
        <p className="text-sm text-gray-300 font-semibold mb-2 sm:mb-0">
          Showing <span className="text-red-400 font-bold">{currentSites.length}</span> of <span className="text-white">{sortedSites.length}</span> sites
        </p>
        <div className="flex items-center gap-6 text-sm text-gray-300">
          <span className="flex items-center gap-2 font-medium">
            <span className="w-3 h-3 bg-red-500 rounded-full shadow-lg"></span>
            Page: <span className="text-white font-bold">{currentPage}</span> of <span className="text-white font-bold">{totalPages}</span>
          </span>
        </div>
      </div>

      {/* Sites List - Full Width Cards */}
      <div className="space-y-4 mb-8">
        {currentSites.map((site) => (
          <div
            key={site.id}
            className="redzone-card rounded-lg p-6 hover:shadow-lg transition-shadow duration-300"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-600 text-white">
                    #{site.rank}
                  </span>
                  <h3 className="text-xl font-semibold text-white">
                    {site.name}
                  </h3>
                </div>
                
                <p className="text-gray-300 mb-4">
                  {site.description}
                </p>
                
                <div className="flex flex-wrap gap-2">
                  {site.features.slice(0, 4).map((feature, index) => (
                    <span
                      key={index}
                      className="inline-flex px-3 py-1 text-sm bg-gray-700 text-gray-200 rounded-full"
                    >
                      {feature}
                    </span>
                  ))}
                  {site.features.length > 4 && (
                    <span className="inline-flex px-3 py-1 text-sm bg-gray-700 text-gray-200 rounded-full">
                      +{site.features.length - 4} more
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex-shrink-0">
                <a
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors duration-200"
                >
                  Visit Site →
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <nav className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-600 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  currentPage === page
                    ? 'bg-red-600 text-white'
                    : 'text-gray-300 bg-gray-800 border border-gray-600 hover:bg-gray-700'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-600 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </nav>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-12 text-center text-sm text-gray-400">
        <p>
          This directory includes the top fantasy football ranking websites and resources from major sports networks, 
          specialized platforms, analytics providers, and expert analysis sites.
        </p>
        <p className="mt-2">
          Sites are ranked based on popularity, content quality, and user engagement in the fantasy football community.
        </p>
      </div>
    </section>
  )
}

export default RankingsContent
