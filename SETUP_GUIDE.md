# Fantasy Red Zone - Setup Guide

## 🚀 Automated Content Updates & News Integration

This guide will help you set up automated content refreshing and news article integration for your Fantasy Red Zone site.

## ✅ What's Been Implemented

### 1. Enhanced YouTube Video Updates
- **Multiple refresh schedules**: 3x daily (6 AM, 2 PM, 10 PM UTC)
- **Broader content coverage**: Multiple search queries for better video discovery
- **Subscription integration**: Pulls from your YouTube subscriptions
- **Platform-agnostic**: Works on Vercel, Netlify, or any hosting platform

### 2. News Article Integration
- **Multi-source support**: ESPN, FantasyPros, NFL.com, Yahoo, Rotoworld, The Athletic
- **Flexible content types**: RSS feeds and web scraping
- **Authentication support**: For premium sites like The Athletic
- **Smart categorization**: Automatically categorizes articles by type
- **Duplicate prevention**: Removes duplicate articles across sources

## 🔧 Setup Instructions

### Step 1: Environment Configuration

1. Copy `env.example` to `.env.local`:
```bash
cp env.example .env.local
```

2. Configure your environment variables:
```env
# Required for deployment
NEXT_PUBLIC_SITE_URL=https://your-deployed-site.vercel.app

# YouTube (keep your existing config)
YOUTUBE_REFRESH_TOKEN=your_existing_token

# News Sources - Choose which ones to enable
NEWS_SOURCES=espn-fantasy,fantasypros,nfl-fantasy,yahoo-fantasy,rotoworld

# Security tokens for cron jobs
CRON_SECRET=your-secure-random-string
REFRESH_TOKEN=another-secure-random-string
```

### Step 2: Deployment Platform Setup

#### Option A: Vercel (Recommended)
1. The `vercel.json` file is already configured for you
2. Deploy your site to Vercel
3. The cron jobs will automatically run 3x daily

#### Option B: GitHub Actions (Any hosting platform)
1. In your GitHub repository, go to Settings → Secrets and variables → Actions
2. Add these secrets:
   - `SITE_URL`: Your deployed site URL
   - `CRON_SECRET`: Same value as in your .env.local
3. The `.github/workflows/refresh-content.yml` will handle the rest

#### Option C: External Cron Service
Set up a cron job to call:
```
GET https://your-site.com/api/cron/daily?secret=YOUR_CRON_SECRET
```

### Step 3: News Sources Configuration

#### Enable/Disable Sources
Edit the `NEWS_SOURCES` environment variable:
```env
# Enable only free sources
NEWS_SOURCES=espn-fantasy,fantasypros,nfl-fantasy,yahoo-fantasy,rotoworld

# Include premium sources (requires authentication)
NEWS_SOURCES=espn-fantasy,fantasypros,nfl-fantasy,yahoo-fantasy,rotoworld,the-athletic
```

#### Premium Site Authentication (Optional)
For sites like The Athletic that require login:
```env
THE_ATHLETIC_USERNAME=your_email@example.com
THE_ATHLETIC_PASSWORD=your_password
```

### Step 4: Test Your Setup

1. **Test manual refresh**:
```bash
curl -X POST "https://your-site.com/api/refresh" \
  -H "Authorization: Bearer YOUR_REFRESH_TOKEN"
```

2. **Test news endpoint**:
```bash
curl "https://your-site.com/api/news?limit=5"
```

3. **Test cron endpoint**:
```bash
curl "https://your-site.com/api/cron/daily?secret=YOUR_CRON_SECRET"
```

## 📊 Monitoring & Troubleshooting

### Check Refresh Status
Visit: `https://your-site.com/api/refresh` (GET request) to see endpoint status

### View Logs
- **Vercel**: Check Function Logs in your Vercel dashboard
- **Other platforms**: Check your hosting platform's logs

### Common Issues

1. **News articles not appearing**:
   - Check if `NEWS_SOURCES` is set correctly
   - Verify the news API endpoint works: `/api/news`
   - Some sites may block scraping - try different sources

2. **Cron jobs not running**:
   - Verify `CRON_SECRET` matches in both environment and cron calls
   - Check your hosting platform's cron job limits

3. **YouTube videos not updating**:
   - Ensure `YOUTUBE_REFRESH_TOKEN` is still valid
   - Check the YouTube API quotas

## 🎯 Customization

### Adding New News Sources
1. Edit `src/config/news-sources.ts`
2. Add your new source configuration
3. Test with the news API endpoint

### Adjusting Refresh Frequency
- **Vercel**: Edit `vercel.json` cron schedule
- **GitHub Actions**: Edit `.github/workflows/refresh-content.yml`
- **External**: Update your cron job frequency

### Content Filtering
The system automatically:
- Categorizes content (News, Rankings, Start/Sit, etc.)
- Extracts relevant tags (QB, RB, WR, Dynasty, etc.)
- Removes duplicates
- Sorts by publish date

## 🔐 Security Notes

- Keep your `CRON_SECRET` and `REFRESH_TOKEN` secure
- Don't commit credentials to your repository
- Use environment variables for all sensitive data
- Consider rate limiting for public endpoints

## 📈 Performance

- **Caching**: All content is cached for 15-30 minutes
- **Parallel fetching**: All sources are fetched simultaneously
- **Error handling**: Failed sources don't break the entire system
- **Deduplication**: Prevents duplicate content across sources

## 🆘 Support

If you need help:
1. Check the API endpoints directly (`/api/news`, `/api/refresh`)
2. Review your environment variables
3. Check your hosting platform's logs
4. Verify your cron job configuration

Your site should now automatically update with fresh YouTube videos and news articles multiple times per day!
