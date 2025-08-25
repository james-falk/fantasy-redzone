'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search, Filter, X } from 'lucide-react'

interface ContentItem {
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

interface ContentFilterProps {
  content: ContentItem[]
  onFilterChange: (filtered: ContentItem[]) => void
}

export default function ContentFilterComponent({ content, onFilterChange }: ContentFilterProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSource, setSelectedSource] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // Extract unique values from content
  const categories = useMemo(() => [...new Set(content.map(item => item.category))].sort(), [content])
  const sources = useMemo(() => [...new Set(content.map(item => item.source))].sort(), [content])
  const allTags = useMemo(() => {
    const tags = content.flatMap(item => item.tags)
    return [...new Set(tags)].sort()
  }, [content])

  // Apply filters
  const filteredContent = useMemo(() => {
    return content.filter(item => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const titleMatch = item.title.toLowerCase().includes(searchLower)
        const descMatch = item.shortDescription.toLowerCase().includes(searchLower)
        if (!titleMatch && !descMatch) return false
      }

      // Category filter
      if (selectedCategory && item.category !== selectedCategory) {
        return false
      }

      // Source filter
      if (selectedSource && item.source !== selectedSource) {
        return false
      }

      // Tags filter
      if (selectedTags.length > 0) {
        const hasTag = selectedTags.some(tag => item.tags.includes(tag))
        if (!hasTag) return false
      }

      return true
    })
  }, [content, searchTerm, selectedCategory, selectedSource, selectedTags])

  // Update parent component
  useEffect(() => {
    onFilterChange(filteredContent)
  }, [filteredContent, onFilterChange])

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('')
    setSelectedSource('')
    setSelectedTags([])
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const hasActiveFilters = searchTerm || selectedCategory || selectedSource || selectedTags.length > 0

  return (
    <div className="mb-8">
      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search fantasy football content..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
        />
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
        >
          <Filter className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full">
              {[searchTerm, selectedCategory, selectedSource, selectedTags.length].filter(Boolean).length}
            </span>
          )}
        </button>

        <button
          onClick={clearFilters}
          disabled={!hasActiveFilters}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
            hasActiveFilters 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          <X className="w-4 h-4" />
          Clear Filters
        </button>
      </div>

      {/* Filter Panel */}
      {isFilterOpen && (
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Source Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Source</label>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="">All Sources</option>
                {sources.map(source => (
                  <option key={source} value={source}>
                    {source === 'youtube' ? '📺 Videos' : 
                     source === 'rss' ? '📰 Articles' : 
                     source === 'news' ? '📰 News' : 
                     source === 'static' ? '🎓 Courses' : source}
                  </option>
                ))}
              </select>
            </div>

            {/* Active Filters Display */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Active Filters</label>
              <div className="flex flex-wrap gap-2">
                {selectedCategory && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-500 text-black">
                    Category: {selectedCategory}
                    <button
                      onClick={() => setSelectedCategory('')}
                      className="ml-1 hover:text-gray-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedSource && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-500 text-black">
                    Source: {selectedSource}
                    <button
                      onClick={() => setSelectedSource('')}
                      className="ml-1 hover:text-gray-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedTags.map(tag => (
                  <span key={tag} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-500 text-black">
                    {tag}
                    <button
                      onClick={() => toggleTag(tag)}
                      className="ml-1 hover:text-gray-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Tags Filter */}
          {allTags.length > 0 && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">Tags</label>
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-yellow-500 text-black'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
