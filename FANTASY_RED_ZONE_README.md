# Fantasy Red Zone

Your ultimate destination for fantasy football content, analysis, and insights. Built on Next.js 15 with modern TypeScript, Tailwind CSS, and a unified content system that aggregates YouTube videos, RSS articles, and expert analysis.

## 🏈 Features

### Current Features
- **Unified Content Directory**: Browse fantasy football videos, articles, and courses in one place
- **Real-time Content Updates**: YouTube videos (30min cache) and RSS feeds (15min cache)
- **Advanced Filtering**: Filter by content type, category, tags, and search terms
- **Mobile-First Design**: Responsive UI that works great on all devices
- **Multiple Content Sources**:
  - 📺 YouTube videos from top fantasy football channels
  - 📰 RSS articles from major sports outlets (ESPN, FantasyPros, etc.)
  - 🎓 Expert analysis courses and guides
- **Smart Categorization**: Automatic content categorization (Dynasty, Rookies, Rankings, etc.)
- **Tag System**: Advanced tagging for league formats (PPR, Superflex, Best Ball, etc.)

### Upcoming AI Features (Phase 2)
- 🤖 **AI Chat Assistant**: Personalized content recommendations
- 📊 **Team Insights Widget**: Upload your roster for trade advice
- 🎯 **AI Team Name Generator**: Creative team names based on your players
- 🔍 **Semantic Search**: Find content by meaning, not just keywords

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- YouTube Data API v3 key (optional, for video content)

### Installation

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd nextjs-directory-site-starter
   npm install
   ```

2. **Environment Setup**
   Create `.env.local` in the project root:
   ```env
   # Fantasy Red Zone Configuration
   NEXT_PUBLIC_SITE_NAME=Fantasy Red Zone
   NEXT_PUBLIC_SITE_DESCRIPTION=Your ultimate destination for fantasy football content

   # API Keys (Optional - app works without these)
   YOUTUBE_API_KEY=your_youtube_api_key_here

   # Content Sources
   RSS_FEED_URL=https://www.fantasypros.com/rss/nfl/news.xml
   BACKUP_RSS_FEED_URL=https://www.espn.com/espn/rss/nfl/news

   # YouTube Channels (Optional)
   FANTASY_PROS_CHANNEL_ID=UCGKlOhLYU7iEhCkx9CHWRfg
   ESPN_FANTASY_CHANNEL_ID=UCiWLfSweyRNmLpgEHekhoAg

   # Caching (in minutes)
   YOUTUBE_CACHE_DURATION=30
   RSS_CACHE_DURATION=15

   # Feature Flags for Future AI Features
   ENABLE_AI_CHAT=false
   ENABLE_TEAM_INSIGHTS=false
   ENABLE_NAME_GENERATOR=false
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000`

## 🏗️ Architecture

### Project Structure
```
src/
├── app/                    # Next.js 15 App Router
│   ├── api/               # API Routes
│   │   ├── youtube/       # YouTube Data API integration
│   │   └── rss/          # RSS feed parser
│   ├── [slug]/           # Dynamic content pages
│   └── page.tsx          # Main homepage
├── components/            # React Components
│   ├── content-filter.tsx    # Advanced filtering UI
│   ├── content-section.tsx   # Client-side content wrapper
│   ├── product-card.tsx      # Content item display
│   └── product-list.tsx      # Content grid layout
├── services/              # Data Layer
│   ├── content.ts         # Unified content service
│   └── courses.ts         # Legacy course service
├── types/                 # TypeScript Definitions
│   └── content.ts         # Unified content types
└── utils/                 # Helper Functions
    └── functions.ts       # Date formatting, etc.
```

### Data Flow

1. **Content Aggregation**
   ```
   Static JSON Files → getStaticCourses()
   YouTube API → getYouTubeContent()
   RSS Feeds → getRSSContent()
            ↓
   getAllContent() → Unified Content[]
   ```

2. **Content Types**
   ```typescript
   interface BaseContent {
     id: string
     title: string
     shortDescription: string
     cover: string
     slug: string
     category: string
     publishDate: string
     source: 'static' | 'youtube' | 'rss'
     tags: string[]
   }
   ```

3. **Client-Server Architecture**
   ```
   Server Components (SSR) → Client Components (Filtering) → UI Updates
   ```

### API Routes

#### `/api/youtube`
- **Purpose**: Fetch fantasy football videos from YouTube
- **Caching**: 30 minutes via node-cache
- **Parameters**:
  - `q`: Search query (default: "fantasy football")
  - `maxResults`: Number of videos (default: 20)
  - `channelId`: Specific channel ID (optional)

#### `/api/rss` 
- **Purpose**: Parse RSS feeds for fantasy football articles
- **Caching**: 15 minutes via node-cache
- **Parameters**:
  - `url`: Custom RSS feed URL (optional)
  - `limit`: Number of articles (default: 20)

## 🎨 UI/UX Features

### Mobile-First Design
- Responsive grid layout (1/2/3 columns)
- Collapsible filter panel on mobile
- Touch-friendly buttons and interactions
- Optimized typography and spacing

### Content Cards
- **Source Indicators**: Visual badges for video/article/course
- **Category Tags**: Fantasy-specific categories
- **Metadata Display**: Author, views, publish date
- **External Links**: Direct links to original content
- **Tag System**: Format-specific tags (PPR, Dynasty, etc.)

### Advanced Filtering
- **Search**: Real-time text search across title/description
- **Content Type**: Filter by videos, articles, courses
- **Categories**: Dynasty, Rookies, Rankings, etc.
- **Tags**: League formats and special categories
- **Active Filter Display**: Visual feedback for applied filters

## 🔧 Development

### Key Dependencies
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type safety and development experience
- **Tailwind CSS 4**: Utility-first styling
- **googleapis**: YouTube Data API integration
- **rss-parser**: RSS feed parsing
- **node-cache**: Server-side caching
- **lucide-react**: Modern icon library

### Adding New Content Sources

1. **Define Content Type**
   ```typescript
   // src/types/content.ts
   interface NewSourceContent extends BaseContent {
     source: 'newsource'
     // Add source-specific fields
   }
   ```

2. **Create API Route**
   ```typescript
   // src/app/api/newsource/route.ts
   export async function GET(request: NextRequest) {
     // Implement fetching logic
     // Return APIResponse<NewSourceContent[]>
   }
   ```

3. **Update Services**
   ```typescript
   // src/services/content.ts
   export const getNewSourceContent = async (): Promise<NewSourceContent[]> => {
     // Implement service method
   }
   ```

4. **Update UI Components**
   - Add source handling in `ProductCard`  
   - Update filter options in `ContentFilter`

### Performance Optimizations
- **Server-side caching** with configurable TTL
- **Image lazy loading** on content cards
- **Efficient filtering** with client-side state management
- **Static generation** for course pages

## 🚀 Deployment

### Environment Variables (Production)
Ensure all environment variables are configured:
- YouTube API key for video content
- RSS feed URLs for article content
- Caching durations for performance
- Feature flags for gradual rollouts

### Recommended Hosting
- **Vercel**: Optimized for Next.js with zero config
- **Netlify**: Great for static sites with API routes
- **Railway/Render**: Full-stack hosting options

## 🗺️ Roadmap

### Phase 1: Foundation (✅ Complete)
- [x] Unified content system
- [x] YouTube API integration
- [x] RSS feed aggregation  
- [x] Advanced filtering
- [x] Mobile-responsive UI
- [x] Fantasy football branding

### Phase 2: AI-Powered Features (Next)
- [ ] **AI Chat Assistant**
  - OpenAI GPT integration
  - Vector database for semantic search
  - Personalized recommendations
  
- [ ] **Team Insights Widget**
  - Roster upload functionality
  - Trade analysis and recommendations
  - Waiver wire suggestions
  
- [ ] **AI Team Name Generator**
  - Player-based name generation
  - League theme customization
  - Social sharing features

### Phase 3: User Personalization
- [ ] User accounts and preferences
- [ ] Favorite content and bookmarks
- [ ] Personalized content feeds
- [ ] Email/push notifications

### Phase 4: Community Features
- [ ] User comments and ratings
- [ ] Content submission by users
- [ ] Fantasy league integration
- [ ] Social features and sharing

## 🤝 Contributing

### Getting Started
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit with clear messages: `git commit -m 'Add amazing feature'`
5. Push to your fork: `git push origin feature/amazing-feature`
6. Create a Pull Request

### Code Style
- TypeScript for all new code
- ESLint configuration provided
- Tailwind CSS for styling
- Component-first architecture

### Adding Content Sources
New content sources should:
- Implement the unified `BaseContent` interface
- Include proper error handling and caching
- Follow existing API route patterns
- Update documentation

## 📝 API Documentation

### Content Types
```typescript
type Content = Course | YouTubeContent | RSSContent

interface Course extends BaseContent {
  source: 'static'
  duration: string
  features: string[]
}

interface YouTubeContent extends BaseContent {
  source: 'youtube'
  videoId: string
  channelTitle: string
  duration: string
  viewCount: number
  url: string
}

interface RSSContent extends BaseContent {
  source: 'rss'
  author?: string
  url: string
  content?: string
  pubDate: string
}
```

### Service Methods
```typescript
// Get all content (recommended)
const content = await getAllContent({
  includeYouTube: true,
  includeRSS: true,
  youtubeQuery: 'fantasy football rankings',
  youtubeMaxResults: 20,
  rssLimit: 15
})

// Filter content
const filtered = filterContent(content, {
  category: 'Dynasty',
  source: 'youtube',
  tags: ['PPR'],
  search: 'quarterback'
})

// Get content categories
const categories = await getContentCategories()

// Get popular content
const popular = await getPopularContent(10)
```

## 🐛 Troubleshooting

### Common Issues

**YouTube API not working**
- Verify API key is correct in `.env.local`
- Check API quota limits in Google Cloud Console
- Ensure YouTube Data API v3 is enabled

**RSS feeds not loading**
- Check RSS feed URLs are accessible
- Verify network connectivity
- Check for CORS issues in development

**Build errors**
- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npm run type-check`

**Performance issues**
- Check cache configuration
- Monitor API response times
- Consider reducing content limits

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built on the excellent [nextjs-directory-site-starter](https://github.com/AbdulBasit313/nextjs-directory-site-starter)
- Fantasy football data from FantasyPros and ESPN
- YouTube content creators in the fantasy football community
- Next.js and Vercel teams for amazing developer experience

---

**Fantasy Red Zone** - Dominate your fantasy leagues with the best content, all in one place! 🏈🏆 