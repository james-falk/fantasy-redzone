# YouTube OAuth Automated Setup Guide

## 🎯 Goal
Set up automated YouTube OAuth token refresh to prevent manual intervention every 3-7 days.

## 🔧 Setup Steps

### 1. Move Google OAuth App to Production

**CRITICAL**: Your OAuth app is likely in "Testing" mode, which expires tokens in 7 days.

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services > OAuth consent screen**
3. Click **PUBLISH APP** to move from Testing to Production
4. This will make refresh tokens last much longer (months/years instead of 7 days)

### 2. Set Up GitHub Secrets

In your GitHub repository settings, add these secrets:

```
REFRESH_TOKEN=your-existing-refresh-token-from-vercel
SITE_URL=https://fantasy-redzone-dzvioueub-james-projects-cf25d43f.vercel.app
GITHUB_TOKEN=automatically-provided-by-github
```

### 3. Manual Token Refresh (One-time)

Since your current token is expired, you need to re-authenticate once:

1. Visit: `https://fantasy-redzone-dzvioueub-james-projects-cf25d43f.vercel.app/api/youtube/setup`
2. Complete the OAuth flow
3. This will generate a new refresh token

### 4. Verify Automation

The GitHub Action will now:
- ✅ Run daily at 6 AM UTC
- ✅ Check token health
- ✅ Refresh if needed
- ✅ Create GitHub issues if manual intervention needed
- ✅ Trigger content refresh after successful token refresh

## 🔍 Monitoring

### Check Token Health Manually
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_REFRESH_TOKEN" \
  "https://your-site.vercel.app/api/youtube/refresh-token"
```

### GitHub Action Logs
- Go to **Actions** tab in your repository
- Check **Refresh YouTube OAuth Token** workflow
- View logs for success/failure details

## 🚨 Alerts

If the refresh token expires, the system will:
1. **Create a GitHub Issue** with urgent label
2. **Log detailed error information**
3. **Provide direct link** to re-authentication

## 📅 Frequency

- **Daily health checks** (6 AM UTC)
- **Automatic refresh** when needed
- **Manual trigger** available via GitHub Actions
- **Content refresh** after successful token refresh

## 🛠️ Troubleshooting

### If Videos Still Don't Appear
1. Check GitHub Action logs
2. Visit `/api/youtube/refresh-token` manually
3. If needed, re-authenticate via `/api/youtube/setup`

### If Token Keeps Expiring
1. Verify OAuth app is in **Production** (not Testing)
2. Check Vercel environment variables
3. Ensure you're not changing Google account password frequently

## 🎉 Benefits

- ✅ **Zero manual intervention** for months/years
- ✅ **Automatic issue creation** when action needed
- ✅ **Daily monitoring** and health checks
- ✅ **Integrated with existing refresh system**
- ✅ **Free GitHub Actions** (no external services needed)
