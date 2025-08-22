# YouTube OAuth Setup Guide

## 🎯 Why OAuth Instead of API Key?

- **API Keys** = Only public data (search results, public videos)
- **OAuth** = Access your personal subscriptions + public data
- **Your Use Case** = Fetching from YOUR subscribed channels = Requires OAuth

## 🚀 Step-by-Step Setup

### 1. Google Cloud Console Setup

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**
2. **Select your project** (or create a new one)
3. **Enable YouTube Data API v3:**
   - Go to "APIs & Services" → "Library"
   - Search for "YouTube Data API v3"
   - Click "Enable"

### 2. Create OAuth 2.0 Credentials

1. **Go to "APIs & Services" → "Credentials"**
2. **Click "Create Credentials" → "OAuth 2.0 Client IDs"**
3. **Configure OAuth consent screen** (if not done):
   - Choose "External" user type
   - Fill in required fields:
     - App name: "Fantasy Red Zone"
     - User support email: Your email
     - Developer contact: Your email
   - **IMPORTANT:** Click "PUBLISH APP" (not "Testing")
4. **Create OAuth Client:**
   - Application type: "Web application"
   - Name: "Fantasy Red Zone YouTube Integration"
   - Authorized redirect URIs:
     - `http://localhost:3000/api/youtube/setup` (for local testing)
     - `https://your-vercel-domain.vercel.app/api/youtube/setup` (for production)

### 3. Get Your Credentials

After creating, you'll get:
- **Client ID** (looks like: `123456789-abcdefg.apps.googleusercontent.com`)
- **Client Secret** (looks like: `GOCSPX-abcdefghijklmnop`)

### 4. Add to Environment Variables

In your Vercel project settings, add:
```env
YOUTUBE_CLIENT_ID=your_client_id_here
YOUTUBE_CLIENT_SECRET=your_client_secret_here
YOUTUBE_REDIRECT_URI=https://your-vercel-domain.vercel.app/api/youtube/setup
```

### 5. Get Refresh Token

1. **Deploy your project first** (so the setup endpoint works)
2. **Visit:** `https://your-vercel-domain.vercel.app/api/youtube/setup`
3. **Follow the OAuth flow:**
   - Click the authorization URL
   - Sign in with YOUR YouTube account (the one with subscriptions)
   - Grant permissions
   - You'll be redirected back with a refresh token
4. **Add the refresh token** to your environment variables:
   ```env
   YOUTUBE_REFRESH_TOKEN=the_long_refresh_token_you_got
   ```

## 🔍 Current Status Check

Let me check what YouTube credentials you currently have configured...
