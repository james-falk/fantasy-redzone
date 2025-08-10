import { NewsSource } from '@/types/news'

export const NEWS_SOURCES: NewsSource[] = [
  // ESPN Fantasy RSS
  {
    id: 'espn-fantasy',
    name: 'ESPN Fantasy',
    url: 'https://www.espn.com/espn/rss/nfl/news',
    type: 'rss',
    requiresAuth: false
  },
  
  // FantasyPros
  {
    id: 'fantasypros',
    name: 'FantasyPros',
    url: 'https://www.fantasypros.com/rss/nfl/news.xml',
    type: 'rss',
    requiresAuth: false
  },
  
  // NFL.com RSS
  {
    id: 'nfl-news',
    name: 'NFL News',
    url: 'https://www.nfl.com/rss/news',
    type: 'rss',
    requiresAuth: false
  },
  
  // Yahoo Sports NFL RSS
  {
    id: 'yahoo-nfl',
    name: 'Yahoo Sports NFL',
    url: 'https://sports.yahoo.com/nfl/rss.xml',
    type: 'rss',
    requiresAuth: false
  },
  
  // CBS Sports Fantasy RSS
  {
    id: 'cbs-fantasy',
    name: 'CBS Sports Fantasy',
    url: 'https://www.cbssports.com/fantasy/football/news/rss/',
    type: 'rss',
    requiresAuth: false
  },
  
  // Pro Football Talk RSS
  {
    id: 'pft',
    name: 'Pro Football Talk',
    url: 'https://profootballtalk.nbcsports.com/feed/',
    type: 'rss',
    requiresAuth: false
  },
  
  // The Athletic (requires auth - example)
  {
    id: 'the-athletic',
    name: 'The Athletic',
    url: 'https://theathletic.com/fantasy-football/',
    type: 'scrape',
    requiresAuth: true,
    selector: {
      title: 'h1, h2, h3',
      content: '.article-content p, .story-content p',
      date: 'time, .timestamp',
      link: 'a[href*="/fantasy"]',
      image: '.article-hero-image img, .story-image img'
    },
    loginConfig: {
      loginUrl: 'https://theathletic.com/login',
      usernameField: 'input[type="email"]',
      passwordField: 'input[type="password"]',
      submitSelector: 'button[type="submit"]'
    }
  },
  
  // Rotoworld (NBC Sports)
  {
    id: 'rotoworld',
    name: 'Rotoworld',
    url: 'https://www.nbcsports.com/fantasy/football',
    type: 'scrape',
    requiresAuth: false,
    selector: {
      title: '.headline a, h3 a',
      content: '.excerpt, .summary',
      date: '.timestamp, time',
      link: 'a[href*="/fantasy/"]',
      image: '.featured-image img, .article-image img'
    }
  }
]

// Helper function to get enabled news sources from environment
export const getEnabledNewsSources = (): NewsSource[] => {
  const enabledSources = process.env.NEWS_SOURCES?.split(',') || []
  
  if (enabledSources.length === 0) {
    // Default to public sources if none specified
    console.log('📰 No NEWS_SOURCES env var found, using default public sources')
    return NEWS_SOURCES.filter(source => !source.requiresAuth)
  }
  
  const filteredSources = NEWS_SOURCES.filter(source => 
    enabledSources.includes(source.id)
  )
  
  console.log(`📰 Enabled news sources: ${filteredSources.map(s => s.name).join(', ')}`)
  return filteredSources
}
