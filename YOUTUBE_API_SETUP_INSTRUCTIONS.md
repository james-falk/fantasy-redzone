# YouTube API Setup Instructions

Your YouTube videos are not showing because the YouTube API key is missing. Here's how to fix it:

## Quick Setup (5 minutes)

1. **Go to Google Cloud Console**: https://console.developers.google.com/
2. **Create a new project** (or select existing one)
3. **Enable YouTube Data API v3**:
   - Go to "APIs & Services" > "Library"
   - Search for "YouTube Data API v3"
   - Click "Enable"

4. **Create an API Key**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the generated API key

5. **Add the API Key to your environment**:
   - Create a file called `.env.local` in the `nextjs-directory-site-starter` folder
   - Add this line: `YOUTUBE_API_KEY=your_api_key_here`
   - Replace `your_api_key_here` with your actual API key

6. **Restart your development server**:
   ```bash
   npm run dev
   ```

## Example .env.local file:
```
YOUTUBE_API_KEY=AIzaSyBvOkBvAp2_your_actual_api_key_here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## That's it!
Once you add the API key, your site will automatically start showing YouTube videos from top fantasy football channels like FantasyPros, The Fantasy Footballers, and NFL.

## Free Tier Limits
- 10,000 requests per day (more than enough for most sites)
- No credit card required for basic usage
- Videos update automatically every 30 minutes

## Troubleshooting
If videos still don't show up:
1. Check the browser console for errors
2. Make sure the API key is correct in `.env.local`
3. Restart the development server after adding the key
