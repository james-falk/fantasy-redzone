import { NewsSource } from '@/types/news'

export const NEWS_SOURCES: NewsSource[] = [
  // ESPN Fantasy
  {
    id: 'espn-fantasy',
    name: 'ESPN Fantasy',
    url: 'https://www.espn.com/fantasy/football/',
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
  
  // NFL.com Fantasy
  {
    id: 'nfl-fantasy',
    name: 'NFL Fantasy',
    url: 'https://www.nfl.com/fantasy/',
    type: 'scrape',
    requiresAuth: false,
    selector: {
      title: 'h3.d3-o-media-object__title, h2.nfl-c-content-header__title',
      content: '.nfl-c-article__content p, .d3-o-media-object__summary',
      date: 'time, .nfl-c-timestamp',
      link: 'a[href*="/fantasy/"]',
      image: 'img.nfl-c-hero-banner__image, img.d3-o-media-object__image'
    }
  },
  
  // Yahoo Fantasy
  {
    id: 'yahoo-fantasy',
    name: 'Yahoo Fantasy',
    url: 'https://sports.yahoo.com/fantasy/football/',
    type: 'scrape',
    requiresAuth: false,
    selector: {
      title: '[data-test-locator="stream-item-title"], h3 a',
      content: '[data-test-locator="stream-item-summary"], .summary',
      date: 'time, [data-test-locator="stream-item-date"]',
      link: 'a[href*="/fantasy/"]',
      image: 'img[data-test-locator="stream-item-image"], .stream-item-image img'
    }
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
    return NEWS_SOURCES.filter(source => !source.requiresAuth)
  }
  
  return NEWS_SOURCES.filter(source => 
    enabledSources.includes(source.id)
  )
}
