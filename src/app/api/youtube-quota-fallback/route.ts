import { NextResponse } from 'next/server'
import { YouTubeContent } from '@/types/content'

// Fallback YouTube content for when API quota is exceeded
const FALLBACK_YOUTUBE_CONTENT: YouTubeContent[] = [
  {
    id: 'youtube_fallback_1',
    title: 'Fantasy Football Week 1 Rankings - Top Picks & Sleepers',
    shortDescription: 'Get ready for Week 1 with our top fantasy football rankings, sleeper picks, and must-start players for your lineup.',
    cover: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&h=300&fit=crop&q=80&auto=format',
    slug: 'fantasy-football-week-1-rankings',
    category: 'Rankings',
    publishDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
    source: 'youtube' as const,
    tags: ['Rankings', 'PPR', 'Start/Sit'],
    videoId: 'fallback_1',
    channelTitle: 'Fantasy Football Today',
    duration: 'PT15M30S',
    viewCount: 125000,
    url: 'https://youtube.com/watch?v=example1',
    thumbnail: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&h=300&fit=crop&q=80&auto=format',
    creatorName: 'Fantasy Football Today'
  },
  {
    id: 'youtube_fallback_2', 
    title: 'Dynasty Fantasy Football - 2025 Rookie Draft Guide',
    shortDescription: 'Complete guide to the 2025 rookie draft with rankings, sleepers, and dynasty strategy tips.',
    cover: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=400&h=300&fit=crop&q=80&auto=format',
    slug: 'dynasty-rookie-draft-guide-2025',
    category: 'Dynasty',
    publishDate: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
    source: 'youtube' as const,
    tags: ['Dynasty', 'Rookies', 'Draft'],
    videoId: 'fallback_2',
    channelTitle: 'FantasyPros',
    duration: 'PT22M15S',
    viewCount: 89000,
    url: 'https://youtube.com/watch?v=example2',
    thumbnail: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=400&h=300&fit=crop&q=80&auto=format',
    creatorName: 'FantasyPros'
  },
  {
    id: 'youtube_fallback_3',
    title: 'Waiver Wire Gems - Hidden Fantasy Football Pickups',
    shortDescription: 'Discover the best waiver wire pickups that could win you your fantasy league this week.',
    cover: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=400&h=300&fit=crop&q=80&auto=format',
    slug: 'waiver-wire-gems-pickups',
    category: 'Waiver Wire',
    publishDate: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(), // 3 days ago
    source: 'youtube' as const,
    tags: ['Waiver Wire', 'Sleepers', 'PPR'],
    videoId: 'fallback_3',
    channelTitle: 'The Fantasy Footballers',
    duration: 'PT18M45S',
    viewCount: 156000,
    url: 'https://youtube.com/watch?v=example3',
    thumbnail: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=400&h=300&fit=crop&q=80&auto=format',
    creatorName: 'The Fantasy Footballers'
  }
]

export async function GET() {
  return NextResponse.json({
    success: true,
    data: FALLBACK_YOUTUBE_CONTENT,
    cached: false,
    total: FALLBACK_YOUTUBE_CONTENT.length,
    message: 'Serving fallback content due to API quota limits'
  })
}
