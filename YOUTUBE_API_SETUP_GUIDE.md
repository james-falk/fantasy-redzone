# YouTube API Key Setup Guide (Simple & Reliable)

## 🎯 Why API Key > OAuth

✅ **API Key Benefits:**
- No token expiration issues
- No complex authentication flows
- Higher rate limits
- Zero maintenance
- More reliable
- Better content control

❌ **OAuth Problems:**
- Tokens expire every 7 days
- Complex setup process
- Requires manual re-authentication
- Tied to personal account
- More maintenance overhead

## 🚀 Quick Setup (5 minutes)

### Step 1: Get YouTube API Key

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project** (or select existing)
3. **Enable YouTube Data API v3**:
   - Go to "APIs & Services" → "Library"
   - Search for "YouTube Data API v3"
   - Click "Enable"
4. **Create API Key**:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the generated API key

### Step 2: Add to Environment Variables

**For Vercel (Production):**
1. Go to your Vercel dashboard
2. Navigate to your project settings
3. Go to "Environment Variables"
4. Add: `YOUTUBE_API_KEY` = `your_api_key_here`

**For Local Development:**
Add to your `.env.local` file:
```env
YOUTUBE_API_KEY=your_api_key_here
```

### Step 3: Restart Your Application

**Local development:**
```bash
# Stop your dev server (Ctrl+C)
# Then restart
npm run dev
```

**Production:**
- Vercel will automatically redeploy when you add the environment variable

## 🎥 What You'll Get

The API fetches videos from these curated fantasy football channels:

### Priority 1 Channels (8 videos each):
- **FantasyPros** - Top fantasy football analysis
- **Fantasy Footballers** - Popular fantasy football podcast
- **Fantasy Football Today** - CBS Sports fantasy content

### Priority 2 Channels (4 videos each):
- **Dynasty Nerds** - Dynasty fantasy football content
- **The Fantasy Headliners** - Fantasy football news and analysis
- **Fantasy Football Advice** - Tips and strategies

## 🔧 Customization

To add more channels, edit `src/app/api/youtube-simple/route.ts`:

```typescript
const FANTASY_FOOTBALL_CHANNELS = [
  {
    id: 'CHANNEL_ID_HERE',
    name: 'Channel Name',
    priority: 1 // 1 = more videos, 2 = fewer videos
  },
  // Add more channels...
]
```

To find a channel ID:
1. Go to the YouTube channel
2. View page source
3. Search for "channelId" or use online tools

## 📊 Rate Limits & Quotas

- **Daily Quota**: 10,000 units (very generous)
- **Search operation**: ~100 units per request
- **Video details**: ~1 unit per video
- **Expected daily usage**: ~500-1000 units (well within limits)

## 🔍 Monitoring

Check your API usage:
1. Go to Google Cloud Console
2. Navigate to "APIs & Services" → "Quotas"
3. Search for "YouTube Data API v3"
4. Monitor your daily usage

## 🚨 Troubleshooting

### No videos showing up?
1. Check if `YOUTUBE_API_KEY` is set in environment variables
2. Verify the API key is valid in Google Cloud Console
3. Ensure YouTube Data API v3 is enabled
4. Check browser console for error messages

### API key not working?
1. Make sure you copied the full API key
2. Check if the key has proper permissions
3. Verify YouTube Data API v3 is enabled for your project
4. Try creating a new API key

### Rate limit exceeded?
- Very unlikely with normal usage
- If it happens, wait 24 hours for quota reset
- Consider optimizing the number of channels or video counts

## 🎯 Results

After setup, your site will show:
- ✅ 20-30 recent YouTube videos from top fantasy football channels
- ✅ Proper thumbnails and metadata
- ✅ Videos from the last 7 days
- ✅ Automatic categorization (Dynasty, Rankings, etc.)
- ✅ No authentication issues
- ✅ Reliable, maintenance-free operation

## 💡 Pro Tips

1. **Monitor your favorite channels** and add their IDs to get their content
2. **Adjust `daysBack` parameter** to get older/newer content
3. **Use priority levels** to get more content from your favorite channels
4. **Set up API key restrictions** in Google Cloud Console for security
5. **Enable API key monitoring** to track usage

This approach is **much better** than OAuth for a public website! 🚀
