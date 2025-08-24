import { ChannelConfig } from '@/services/youtube-ingestion'

// Popular Fantasy Football YouTube Channels
export const FANTASY_FOOTBALL_CHANNELS: ChannelConfig[] = [
  {
    id: 'UCWJ2lWNubArHWmf3FIHbfcQ', // Fantasy Footballers
    name: 'Fantasy Footballers',
    maxResults: 25
  },
  {
    id: 'UCBqJ7CbQqdPz0dOjT8nCv8A', // FantasyPros
    name: 'FantasyPros',
    maxResults: 20
  },
  {
    id: 'UCYwVQJt9uQmIRxXut9cWP5A', // CBS Sports Fantasy
    name: 'CBS Sports Fantasy',
    maxResults: 20
  },
  {
    id: 'UCZgxJbLh5LVv2pBA7m2bxSw', // NFL Fantasy
    name: 'NFL Fantasy',
    maxResults: 20
  },
  {
    id: 'UCX6OQ3DkcsbYNE6H8uQQuVA', // MrBeast (for testing)
    name: 'MrBeast',
    maxResults: 10
  }
]

// Channel categories for organization
export const CHANNEL_CATEGORIES = {
  FANTASY_FOOTBALL: [
    'UCWJ2lWNubArHWmf3FIHbfcQ', // Fantasy Footballers
    'UCBqJ7CbQqdPz0dOjT8nCv8A', // FantasyPros
    'UCYwVQJt9uQmIRxXut9cWP5A', // CBS Sports Fantasy
    'UCZgxJbLh5LVv2pBA7m2bxSw'  // NFL Fantasy
  ],
  SPORTS_GENERAL: [
    'UCYwVQJt9uQmIRxXut9cWP5A', // CBS Sports Fantasy
    'UCZgxJbLh5LVv2pBA7m2bxSw'  // NFL Fantasy
  ],
  ENTERTAINMENT: [
    'UCX6OQ3DkcsbYNE6H8uQQuVA'  // MrBeast
  ]
}

// Get channels by category
export function getChannelsByCategory(category: keyof typeof CHANNEL_CATEGORIES): ChannelConfig[] {
  const channelIds = CHANNEL_CATEGORIES[category]
  return FANTASY_FOOTBALL_CHANNELS.filter(channel => channelIds.includes(channel.id))
}

// Get all fantasy football channels
export function getFantasyFootballChannels(): ChannelConfig[] {
  return getChannelsByCategory('FANTASY_FOOTBALL')
}

// Get channel by ID
export function getChannelById(channelId: string): ChannelConfig | undefined {
  return FANTASY_FOOTBALL_CHANNELS.find(channel => channel.id === channelId)
}

// Get channel by name
export function getChannelByName(name: string): ChannelConfig | undefined {
  return FANTASY_FOOTBALL_CHANNELS.find(channel => 
    channel.name.toLowerCase().includes(name.toLowerCase())
  )
}
