# Testing & Deployment Plan

## 🎯 **Current Status**
- ✅ Enhanced logging system implemented
- ✅ YouTube OAuth setup already configured  
- ✅ Error codes and monitoring ready
- 🔄 **Ready to deploy and test**

## 🚀 **Step 1: Deploy to Vercel**

### Quick Deploy Command:
```bash
# If using Vercel CLI
vercel --prod

# Or push to main branch (auto-deploys)
git add .
git commit -m "Enhanced logging and monitoring system"
git push origin main
```

## 🔧 **Step 2: Environment Variables Check**

Make sure these are set in **Vercel Dashboard** → Your Project → Settings → Environment Variables:

### Required Variables:
```env
NEXT_PUBLIC_SITE_URL=https://your-vercel-domain.vercel.app
CRON_SECRET=your-secure-cron-secret
REFRESH_TOKEN=your-secure-refresh-token
NEWS_SOURCES=espn-fantasy,fantasypros,nfl-fantasy,yahoo-fantasy,rotoworld
```

### YouTube OAuth (if you have them):
```env
YOUTUBE_CLIENT_ID=your_client_id
YOUTUBE_CLIENT_SECRET=your_client_secret  
YOUTUBE_REDIRECT_URI=https://your-vercel-domain.vercel.app/api/youtube/setup
YOUTUBE_REFRESH_TOKEN=your_refresh_token
```

## 🧪 **Step 3: Test Endpoints**

### A. Health Check Test
```bash
curl https://your-vercel-domain.vercel.app/api/health
```
**Expected:** JSON response with system health status

### B. Manual Content Refresh Test
```bash
curl -X POST "https://your-vercel-domain.vercel.app/api/refresh" \
  -H "Authorization: Bearer YOUR_REFRESH_TOKEN" \
  -H "Content-Type: application/json"
```
**Expected:** Success response with detailed results

### C. Individual Content Tests
```bash
# Test RSS
curl "https://your-vercel-domain.vercel.app/api/rss?limit=5"

# Test News
curl "https://your-vercel-domain.vercel.app/api/news?limit=5"

# Test YouTube (if OAuth configured)
curl "https://your-vercel-domain.vercel.app/api/youtube/subscriptions?maxResults=5"
```

## 📊 **Step 4: Monitor Vercel Logs**

### Where to Look:
1. **Vercel Dashboard** → Your Project → **Functions** tab
2. Click on any function (like `api/refresh`) 
3. View the **Logs** section

### What to Look For:

#### ✅ **Success Logs:**
```json
{
  "level": "INFO",
  "message": "✅ RSS ARTICLES content update completed successfully",
  "payload": {
    "source": "rss", 
    "count": 25,
    "items": [...]
  }
}
```

#### ❌ **Error Logs:**
```json
{
  "level": "ERROR",
  "message": "YouTube Subscriptions API failed",
  "context": {
    "errorCode": "REFRESH_003",
    "requestId": "youtube_subs_...",
  }
}
```

## 🔍 **Step 5: YouTube OAuth Setup (if needed)**

If YouTube isn't working, you'll see logs like:
```json
{
  "message": "No YouTube refresh token configured",
  "context": {
    "hasClientId": true,
    "hasClientSecret": true,
    "hasRefreshToken": false
  }
}
```

### Fix YouTube OAuth:
1. **Visit:** `https://your-vercel-domain.vercel.app/api/youtube/setup`
2. **Follow the OAuth flow** (sign in with your YouTube account)
3. **Copy the refresh token** and add to Vercel environment variables
4. **Redeploy** or wait for next cron run

## 🎯 **Step 6: Test the Cron Job**

The cron job runs every 4 hours automatically, but you can test it manually:

### Manual Cron Trigger:
```bash
curl "https://your-vercel-domain.vercel.app/api/cron/daily?secret=YOUR_CRON_SECRET"
```

### Check Cron Logs:
Look for logs like:
```json
{
  "message": "✅ Cron job 'daily_content_refresh' completed successfully",
  "payload": {
    "summary": {
      "successful": 3,
      "failed": 0,
      "duration": 8742
    },
    "performance": {
      "totalContentItems": 87,
      "averageResponseTime": 2847
    }
  }
}
```

## 📱 **Step 7: Visual Verification**

### Health Dashboard:
Visit: `https://your-vercel-domain.vercel.app/admin/health`

**Should show:**
- ✅ Green health score
- ✅ Working endpoints
- ✅ Environment variables configured
- ✅ Recent successful operations

### Main Site:
Visit: `https://your-vercel-domain.vercel.app`

**Should show:**
- ✅ Fresh articles from RSS feeds
- ✅ News articles from multiple sources  
- ✅ YouTube videos (if OAuth configured)
- ✅ Recent timestamps on content

## 🚨 **Troubleshooting Guide**

### If RSS/News Fails:
- Check `NEWS_SOURCES` environment variable
- Look for `REFRESH_004` or `REFRESH_005` error codes
- Network issues usually auto-retry

### If YouTube Fails:
- Look for `REFRESH_003` error code
- Check `tokenStatus` in logs
- May need to re-authenticate via `/api/youtube/setup`

### If Cron Doesn't Run:
- Check `CRON_SECRET` matches in environment and calls
- Verify Vercel cron configuration in `vercel.json`
- Manual trigger should work immediately

### If Logs Are Missing:
- Wait a few minutes after deployment
- Check you're looking at the right function
- Try manual refresh to generate logs

## ✅ **Success Criteria**

You'll know it's working when you see:

1. **✅ Health Dashboard** shows green status
2. **✅ Vercel Logs** show detailed success messages with payloads
3. **✅ Content Updates** appear on your site with recent timestamps  
4. **✅ Cron Jobs** run automatically every 4 hours
5. **✅ Error Codes** help identify any issues quickly

## 🎉 **Ready to Deploy?**

1. **Deploy** your changes
2. **Set environment variables** in Vercel  
3. **Run the test commands** above
4. **Check Vercel logs** for detailed success/error information
5. **Visit the health dashboard** for real-time monitoring

The enhanced logging will give you complete visibility into every operation!
