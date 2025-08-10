# Local Development Setup

## 🚨 Quick Fix for 500 Errors

You're getting 500 errors because you need to create a `.env.local` file for local development.

### 1. Create `.env.local` file

Create a file named `.env.local` in the root directory with these contents:

```env
# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=Fantasy Red Zone

# Content Sources (RSS feeds work without auth)
RSS_FEED_URL=https://www.espn.com/espn/rss/nfl/news
BACKUP_RSS_FEED_URL=https://www.fantasypros.com/rss/nfl/news.xml

# News Sources (these RSS sources work without auth)
NEWS_SOURCES=espn-fantasy,fantasypros,nfl-news,yahoo-nfl,cbs-fantasy,pft

# Caching Configuration
RSS_CACHE_DURATION=15
NEWS_CACHE_DURATION=15

# For local testing only
CRON_SECRET=local-dev-secret
REFRESH_TOKEN=local-dev-refresh-token
```

### 2. Optional: Add YouTube OAuth (for videos)

If you want YouTube videos in local development, add these to `.env.local`:

```env
# YouTube OAuth (get from Google Cloud Console)
YOUTUBE_CLIENT_ID=your_client_id_here
YOUTUBE_CLIENT_SECRET=your_client_secret_here
YOUTUBE_REDIRECT_URI=http://localhost:3000/api/auth/youtube/callback
YOUTUBE_REFRESH_TOKEN=your_refresh_token_here
```

### 3. Restart Development Server

```bash
# Stop current server (Ctrl+C)
# Then restart
npm run dev
```

## 🎯 What Will Work

**With basic `.env.local`:**
- ✅ RSS news articles (ESPN, FantasyPros, etc.)
- ✅ Featured article styling
- ✅ Filters and search
- ❌ YouTube videos (need OAuth setup)

**With YouTube OAuth added:**
- ✅ Everything above
- ✅ YouTube subscription videos
- ✅ Full functionality

## 🔍 Troubleshooting

If you still get errors:
1. Check the terminal/console for specific error messages
2. Verify `.env.local` file exists and has the right content
3. Make sure you restarted the dev server after creating the file
4. Check browser console for any client-side errors

The production site will work fine - this only affects local development.
