export interface NewsSource {
  id: string
  name: string
  url: string
  type: 'rss' | 'scrape' | 'api'
  requiresAuth: boolean
  selector?: {
    title: string
    content: string
    date: string
    link: string
    image?: string
  }
  headers?: Record<string, string>
  loginConfig?: {
    loginUrl: string
    usernameField: string
    passwordField: string
    submitSelector: string
  }
}

export interface NewsArticle {
  id: string
  title: string
  shortDescription: string
  content?: string
  cover: string
  slug: string
  category: string
  publishDate: string
  source: 'news'
  tags: string[]
  url: string
  sourceId: string
  sourceName: string
  author?: string
}
