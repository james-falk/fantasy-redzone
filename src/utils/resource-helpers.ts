import { IResource } from '@/models/Resource'
import mongoose from 'mongoose'

const FALLBACK_IMAGE_URL = "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&q=80"

export interface ResourceInput {
  title: string
  description?: string
  url: string
  image?: string | null
  audioUrl?: string | null
  videoUrl?: string | null
  source: string
  author?: string | null
  category: string
  tags?: string[]
  keywords?: string[]
  pubDate: Date
  rawFeedItem?: object | null
  creatorId?: string | null
}

/**
 * Extract keywords from text content (title and description)
 * This function identifies player names, teams, and fantasy football terms
 */
export function extractKeywords(title: string, description: string = ""): string[] {
  const text = `${title} ${description}`.toLowerCase()
  const keywords: string[] = []

  // Common fantasy football player names (this could be expanded with a database)
  const playerNames = [
    'joe burrow', 'patrick mahomes', 'josh allen', 'justin herbert', 'lamar jackson',
    'jalen hurts', 'dak prescott', 'aaron rodgers', 'tom brady', 'russell wilson',
    'christian mccaffrey', 'austin ekeler', 'derrick henry', 'nick chubb', 'saquon barkley',
    'dalvin cook', 'alvin kamara', 'joe mixon', 'james conner', 'leonard fournette',
    'tyreek hill', 'justin jefferson', 'davante adams', 'stefon diggs', 'aj brown',
    'cee dee lamb', 'jaylen waddle', 'amari cooper', 'keenan allen', 'mike evans',
    'travis kelce', 'mark andrews', 'george kittle', 'darren waller', 'kyle pitts',
    't.j. hockenson', 'dallas goedert', 'pat freiermuth', 'cole kmet', 'dawson knox'
  ]

  // NFL team names
  const teamNames = [
    'bengals', 'chiefs', 'bills', 'chargers', 'ravens', 'eagles', 'cowboys', 'packers',
    'patriots', 'broncos', '49ers', 'vikings', 'browns', 'giants', 'cardinals', 'saints',
    'steelers', 'titans', 'colts', 'jaguars', 'texans', 'raiders', 'rams', 'seahawks',
    'buccaneers', 'falcons', 'panthers', 'bears', 'lions', 'commanders', 'jets', 'dolphins'
  ]

  // Fantasy football specific terms
  const fantasyTerms = [
    'fantasy football', 'start/sit', 'waiver wire', 'rankings', 'sleepers', 'busts',
    'injury', 'injury report', 'out', 'questionable', 'doubtful', 'probable',
    'touchdown', 'passing yards', 'rushing yards', 'receiving yards', 'fantasy points',
    'ppr', 'standard', 'half ppr', 'dynasty', 'redraft', 'keeper', 'auction',
    'draft', 'mock draft', 'adp', 'average draft position', 'bye week', 'playoffs'
  ]

  // Check for player names
  playerNames.forEach(player => {
    if (text.includes(player)) {
      keywords.push(player)
    }
  })

  // Check for team names
  teamNames.forEach(team => {
    if (text.includes(team)) {
      keywords.push(team)
    }
  })

  // Check for fantasy football terms
  fantasyTerms.forEach(term => {
    if (text.includes(term)) {
      keywords.push(term)
    }
  })

  // Extract potential player names using common patterns
  const namePatterns = [
    /\b[a-z]+\s+[a-z]+\b/g, // First Last pattern
    /\b[a-z]+\s+[a-z]+\s+[a-z]+\b/g, // First Middle Last pattern
  ]

  namePatterns.forEach(pattern => {
    const matches = text.match(pattern)
    if (matches) {
      matches.forEach(match => {
        // Only add if it looks like a real name (not common words)
        const words = match.split(' ')
        if (words.length >= 2 && words.every(word => word.length > 2)) {
          keywords.push(match)
        }
      })
    }
  })

  // Remove duplicates and normalize
  return [...new Set(keywords.map(keyword => keyword.trim().toLowerCase()))]
}

/**
 * Process resource data and apply fallback image logic
 */
export function processResourceData(data: ResourceInput): Partial<IResource> {
  // Extract keywords if not provided
  const extractedKeywords = data.keywords || extractKeywords(data.title, data.description || "")
  
  return {
    title: data.title,
    description: data.description || "",
    url: data.url,
    image: data.image || FALLBACK_IMAGE_URL,
    audioUrl: data.audioUrl || null,
    videoUrl: data.videoUrl || null,
    source: data.source,
    author: data.author || null,
    category: data.category,
    tags: data.tags || [],
    keywords: extractedKeywords,
    pubDate: data.pubDate,
    fetchedAt: new Date(),
    rawFeedItem: data.rawFeedItem || null,
    favoritedBy: [],
    creatorId: data.creatorId ? new mongoose.Types.ObjectId(data.creatorId) : null,
    isActive: true
  }
}

/**
 * Get the fallback image URL
 */
export function getFallbackImageUrl(): string {
  return FALLBACK_IMAGE_URL
}

/**
 * Validate if a resource has all required fields
 */
export function validateResourceData(data: ResourceInput): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!data.title) errors.push('Title is required')
  if (!data.url) errors.push('URL is required')
  if (!data.source) errors.push('Source is required')
  if (!data.category) errors.push('Category is required')
  if (!data.pubDate) errors.push('Publication date is required')
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Normalize tags array (remove duplicates, trim whitespace, etc.)
 */
export function normalizeTags(tags: string[]): string[] {
  return [...new Set(tags.map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0))]
}

/**
 * Normalize keywords array (remove duplicates, trim whitespace, etc.)
 */
export function normalizeKeywords(keywords: string[]): string[] {
  return [...new Set(keywords.map(keyword => keyword.trim().toLowerCase()).filter(keyword => keyword.length > 0))]
}

/**
 * Validate and clean image URL
 */
export function validateImageUrl(url: string | null | undefined): string {
  if (!url || url.trim() === "") {
    return FALLBACK_IMAGE_URL
  }
  
  // Basic URL validation
  try {
    new URL(url)
    return url
  } catch {
    return FALLBACK_IMAGE_URL
  }
}

/**
 * Build search query combining text search and keyword matching
 */
export function buildSearchQuery(searchTerm: string): Record<string, unknown> {
  const normalizedSearchTerm = searchTerm.trim().toLowerCase()
  
  // If search term is empty, return empty query
  if (!normalizedSearchTerm) {
    return {}
  }

  // Build query with both text search and keyword matching
  return {
    $or: [
      // Text search on title and description
      { $text: { $search: normalizedSearchTerm } },
      // Exact keyword matching
      { keywords: { $in: [normalizedSearchTerm] } },
      // Partial keyword matching
      { keywords: { $regex: normalizedSearchTerm, $options: 'i' } },
      // Tag matching
      { tags: { $in: [normalizedSearchTerm] } },
      { tags: { $regex: normalizedSearchTerm, $options: 'i' } }
    ]
  }
}
