// Base content interface that all content types extend
export interface BaseContent {
  id: string
  title: string
  shortDescription: string
  cover: string
  slug: string
  category: string
  publishDate: string
  source: 'static' | 'youtube' | 'rss' | 'news'
  tags: string[]
}

// Extended interface for static course content
export interface Course extends BaseContent {
  source: 'static'
  duration: string
  features: string[]
}

// Interface for YouTube video content
export interface YouTubeContent extends BaseContent {
  source: 'youtube'
  videoId: string
  channelTitle: string
  duration: string
  viewCount: number
  url: string
  thumbnail?: string // High-quality thumbnail URL
  creatorName?: string // YouTube channel name
}

// Interface for RSS article content
export interface RSSContent extends BaseContent {
  source: 'rss'
  author?: string
  url: string
  content?: string
  pubDate: string
  sourceName?: string // News outlet name (e.g., "ESPN", "FantasyPros")
}

// Import news types
import { NewsArticle } from './news'

// Union type for all content
export type Content = Course | YouTubeContent | RSSContent | NewsArticle

// Content filter interface
export interface ContentFilter {
  category?: string
  source?: Content['source']
  tags?: string[]
  search?: string
  leagueType?: 'Dynasty' | 'Redraft'
}

// API response interfaces
export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
  cached?: boolean
  cacheExpiry?: number
}

export interface ContentListResponse extends APIResponse<Content[]> {
  total: number
  page: number
  limit: number
}

// Fantasy football specific categories
export const FANTASY_CATEGORIES = [
  'News',
  'Analysis', 
  'Rankings',
  'Dynasty',
  'Podcasts',
  'Rookies',
  'Trades',
  'Waiver Wire',
  'Start/Sit'
] as const

export const LEAGUE_TYPES = ['Dynasty', 'Redraft'] as const

export type FantasyCategory = typeof FANTASY_CATEGORIES[number]
export type LeagueType = typeof LEAGUE_TYPES[number] 