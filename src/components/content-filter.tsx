'use client'

import { useState, useEffect } from 'react'
import { Content, ContentFilter, FANTASY_CATEGORIES, LEAGUE_TYPES, LeagueType } from '@/types/content'
import { Search, Filter, X } from 'lucide-react'

interface ContentFilterProps {
  content: Content[]
  onFilterChange: (filteredContent: Content[]) => void
  className?: string
}

export default function ContentFilterComponent({ content, onFilterChange, className = '' }: ContentFilterProps) {
  const [filter, setFilter] = useState<ContentFilter>({})
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Use predefined fantasy categories and get unique values for other filters
  const categories = FANTASY_CATEGORIES
  const sources = [...new Set(content.map(item => item.source))]
  const allTags = [...new Set(content.flatMap(item => item.tags))].sort()

  // Apply filters
  useEffect(() => {
    let filtered = [...content]

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(searchLower) ||
        item.shortDescription.toLowerCase().includes(searchLower) ||
        item.category.toLowerCase().includes(searchLower) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchLower))
      )
    }

    // Category filter
    if (filter.category) {
      filtered = filtered.filter(item => item.category === filter.category)
    }

    // Source filter
    if (filter.source) {
      filtered = filtered.filter(item => item.source === filter.source)
    }

    // Tags filter
    if (filter.tags && filter.tags.length > 0) {
      filtered = filtered.filter(item => 
        filter.tags!.some(tag => item.tags.includes(tag))
      )
    }

    // League Type filter - for now we'll filter based on tags, later this can be more sophisticated
    if (filter.leagueType) {
      const leagueTypeLower = filter.leagueType.toLowerCase()
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(leagueTypeLower) ||
        item.shortDescription.toLowerCase().includes(leagueTypeLower) ||
        item.tags.some(tag => tag.toLowerCase().includes(leagueTypeLower))
      )
    }

    onFilterChange(filtered)
  }, [content, filter, searchTerm]) // Removed onFilterChange from dependencies

  const handleCategoryChange = (category: string) => {
    setFilter(prev => ({
      ...prev,
      category: prev.category === category ? undefined : category
    }))
  }

  const handleSourceChange = (source: string) => {
    setFilter(prev => ({
      ...prev,
      source: prev.source === source ? undefined : source as Content['source']
    }))
  }

  const handleTagToggle = (tag: string) => {
    setFilter(prev => {
      const currentTags = prev.tags || []
      const newTags = currentTags.includes(tag)
        ? currentTags.filter(t => t !== tag)
        : [...currentTags, tag]
      
      return {
        ...prev,
        tags: newTags.length > 0 ? newTags : undefined
      }
    })
  }

  const handleLeagueTypeChange = (leagueType: LeagueType) => {
    setFilter(prev => ({
      ...prev,
      leagueType: prev.leagueType === leagueType ? undefined : leagueType
    }))
  }

  const clearFilters = () => {
    setFilter({})
    setSearchTerm('')
  }

  const hasActiveFilters = filter.category || filter.source || (filter.tags && filter.tags.length > 0) || filter.leagueType || searchTerm

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'youtube': return '📺'
      case 'rss': return '📰'
      case 'static': return '🎓'
      default: return '📄'
    }
  }

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'youtube': return 'Videos'
      case 'rss': return 'Articles'
      case 'static': return 'Courses'
      default: return source
    }
  }

  return (
    <div className={`redzone-card rounded-xl shadow-lg border border-red-600/20 p-6 mb-8 ${className}`}>
      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="🔍 Search fantasy football content..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-black/20 border border-red-600/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-white placeholder-gray-400 shadow-lg"
        />
      </div>

      {/* Filter Toggle for Mobile */}
      <div className="flex items-center justify-between mb-6 lg:hidden">
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg redzone-gradient-intense text-white font-semibold shadow-lg hover:scale-105 transition-transform"
        >
          <Filter className="w-4 h-4" />
          FILTERS
          {hasActiveFilters && (
            <span className="bg-white text-red-600 text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
              {(filter.tags?.length || 0) + (filter.category ? 1 : 0) + (filter.source ? 1 : 0) + (filter.leagueType ? 1 : 0) + (searchTerm ? 1 : 0)}
            </span>
          )}
        </button>
        
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-2 text-gray-300 hover:text-white text-sm font-medium transition-colors"
          >
            <X className="w-4 h-4" />
            CLEAR
          </button>
        )}
      </div>

      {/* Filters */}
      <div className={`space-y-6 ${isFilterOpen || 'lg:block'} ${!isFilterOpen && 'hidden lg:block'}`}>
        {/* League Type Toggle */}
        <div>
          <h3 className="font-bold text-white mb-3 text-sm uppercase tracking-wider">League Type</h3>
          <div className="flex gap-2">
            {LEAGUE_TYPES.map(leagueType => (
              <button
                key={leagueType}
                onClick={() => handleLeagueTypeChange(leagueType)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
                  filter.leagueType === leagueType
                    ? 'redzone-gradient-intense text-white shadow-lg redzone-glow scale-105'
                    : 'bg-white/10 text-gray-300 hover:bg-red-600/20 hover:text-white border border-white/20 hover:border-red-600/30'
                }`}
              >
                {leagueType.toUpperCase()}
              </button>
            ))}
          </div>
        </div>



        {/* Content Sources */}
        <div>
          <h3 className="font-bold text-white mb-3 text-sm uppercase tracking-wider">Content Types</h3>
          <div className="flex flex-wrap gap-2">
            {sources.map(source => (
              <button
                key={source}
                onClick={() => handleSourceChange(source)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                  filter.source === source
                    ? 'redzone-gradient-intense text-white shadow-lg redzone-glow'
                    : 'bg-white/10 text-gray-300 hover:bg-red-600/20 hover:text-white border border-white/20 hover:border-red-600/30'
                }`}
              >
                <span>{getSourceIcon(source)}</span>
                {getSourceLabel(source).toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div>
          <h3 className="font-bold text-white mb-3 text-sm uppercase tracking-wider">Categories</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                  filter.category === category
                    ? 'redzone-gradient-intense text-white shadow-lg redzone-glow'
                    : 'bg-white/10 text-gray-300 hover:bg-red-600/20 hover:text-white border border-white/20 hover:border-red-600/30'
                }`}
              >
                {category.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Popular Tags */}
        {allTags.length > 0 && (
          <div>
            <h3 className="font-bold text-white mb-3 text-sm uppercase tracking-wider">Popular Tags</h3>
            <div className="flex flex-wrap gap-2">
              {allTags.slice(0, 10).map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-300 ${
                    filter.tags?.includes(tag)
                      ? 'redzone-gradient text-white shadow-lg'
                      : 'bg-white/10 text-gray-400 hover:bg-red-600/20 hover:text-white border border-white/20 hover:border-red-600/30'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Clear Filters - Desktop */}
        {hasActiveFilters && (
          <div className="hidden lg:block pt-4 border-t border-red-600/20">
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white text-sm font-semibold border border-white/20 hover:border-red-600/30 rounded-lg hover:bg-red-600/10 transition-all duration-300"
            >
              <X className="w-4 h-4" />
              CLEAR ALL FILTERS
            </button>
          </div>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-6 pt-4 border-t border-red-600/20">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-gray-300 font-semibold text-sm">ACTIVE FILTERS:</span>
            {filter.leagueType && (
              <span className="px-3 py-1 rounded-full text-xs font-bold redzone-gradient-intense text-white shadow-lg">
                {filter.leagueType.toUpperCase()}
              </span>
            )}
            {filter.category && (
              <span className="px-3 py-1 rounded-full text-xs font-bold redzone-gradient-intense text-white shadow-lg">
                {filter.category.toUpperCase()}
              </span>
            )}
            {filter.source && (
              <span className="px-3 py-1 rounded-full text-xs font-bold redzone-gradient-intense text-white shadow-lg">
                {getSourceLabel(filter.source).toUpperCase()}
              </span>
            )}
            {filter.tags?.map(tag => (
              <span key={tag} className="px-3 py-1 rounded-full text-xs font-bold redzone-gradient text-white shadow-lg">
                #{tag}
              </span>
            ))}
            {searchTerm && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-600 text-white shadow-lg">
                &ldquo;{searchTerm}&rdquo;
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 