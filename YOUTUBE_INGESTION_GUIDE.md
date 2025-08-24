# YouTube API Ingestion Workflow Guide

## Overview

This guide documents the YouTube API ingestion workflow for the Fantasy Red Zone application. The system fetches videos from YouTube channels, processes them, and stores them in MongoDB with keyword extraction for search functionality.

## Architecture

### Components

1. **YouTubeAPIService** (`src/services/youtube.ts`)
   - Handles YouTube Data API v3 interactions
   - Fetches channel information and videos
   - Converts YouTube video data to Resource format

2. **YouTubeIngestionService** (`src/services/youtube-ingestion.ts`)
   - Manages the ingestion process
   - Handles database operations
   - Provides statistics and error handling

3. **API Routes**
   - `/api/youtube/test` - Test YouTube API connectivity
   - `/api/youtube/ingest` - Trigger video ingestion

4. **Configuration** (`src/config/youtube-channels.ts`)
   - Predefined fantasy football channels
   - Channel categories and utilities

## Environment Variables

### Required Variables

```bash
# YouTube Data API v3 Key
YOUTUBE_API_KEY=AIzaSyDpCk6TkbxTwqA25oXRiPFTVe4Gtmj3i24

# MongoDB Connection
MONGODB_URI=mongodb+srv://james:mOz8wKkPYDWFjsw3@fantasy-redzone.e9curud.mongodb.net/fantasyredzone?retryWrites=true&w=majority&appName=fantasy-redzone
```

### Setup Instructions

1. Create `.env.local` file in the project root
2. Add the required environment variables
3. Restart the development server

## API Endpoints

### Test YouTube API Connection

**GET** `/api/youtube/test`

Tests the YouTube API connection and returns sample data.

**Response:**
```json
{
  "success": true,
  "message": "YouTube API test completed successfully",
  "apiKeyStatus": "Present",
  "channelInfo": {
    "id": "UCq-Fj5jknLsUf-MWSy4_brA",
    "title": "ESPN Fantasy Football",
    "description": "The official ESPN Fantasy Football channel...",
    "subscriberCount": "123456",
    "videoCount": "789"
  },
  "videosFound": 5,
  "sampleVideo": {
    "id": "dQw4w9WgXcQ",
    "title": "Fantasy Football Week 15 Start/Sit Decisions",
    "channelTitle": "ESPN Fantasy Football",
    "publishedAt": "2024-12-15T10:00:00Z",
    "viewCount": "50000",
    "likeCount": "1200"
  },
  "convertedResource": {
    "title": "Fantasy Football Week 15 Start/Sit Decisions",
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "source": "YouTube",
    "author": "ESPN Fantasy Football",
    "category": "Video",
    "keywords": ["fantasy football", "start/sit", "week 15"]
  }
}
```

### Trigger Video Ingestion

**POST** `/api/youtube/ingest`

Triggers video ingestion from YouTube channels.

**Request Body Options:**

1. **Default Channels (No body required):**
   ```json
   {}
   ```

2. **Specific Channel ID:**
   ```json
   {
     "channelId": "UCq-Fj5jknLsUf-MWSy4_brA",
     "maxResults": 25
   }
   ```

3. **Channel Username:**
   ```json
   {
     "channelUsername": "ESPNFantasyFootball",
     "maxResults": 25
   }
   ```

4. **Multiple Custom Channels:**
   ```json
   {
     "channels": [
       {
         "id": "UCq-Fj5jknLsUf-MWSy4_brA",
         "name": "ESPN Fantasy Football",
         "maxResults": 25
       },
       {
         "id": "UCWJ2lWNubArHWmf3FIHbfcQ",
         "name": "Fantasy Footballers",
         "maxResults": 25
       }
     ]
   }
   ```

**Response:**
```json
{
  "success": true,
  "message": "YouTube ingestion completed successfully",
  "result": {
    "success": true,
    "totalVideos": 50,
    "newVideos": 45,
    "updatedVideos": 5,
    "skippedVideos": 0,
    "errors": [],
    "channels": [
      {
        "channelId": "UCq-Fj5jknLsUf-MWSy4_brA",
        "channelName": "ESPN Fantasy Football",
        "videosFound": 25,
        "videosProcessed": 25,
        "errors": []
      }
    ]
  },
  "stats": {
    "totalResources": 150,
    "youtubeResources": 50,
    "channels": ["ESPN Fantasy Football", "Fantasy Footballers"],
    "latestIngestion": "2024-12-15T10:30:00Z"
  }
}
```

### Get Ingestion Statistics

**GET** `/api/youtube/ingest`

Returns current ingestion statistics and default channels.

**Response:**
```json
{
  "success": true,
  "message": "YouTube ingestion statistics retrieved",
  "stats": {
    "totalResources": 150,
    "youtubeResources": 50,
    "channels": ["ESPN Fantasy Football", "Fantasy Footballers"],
    "latestIngestion": "2024-12-15T10:30:00Z"
  },
  "defaultChannels": [
    {
      "id": "UCq-Fj5jknLsUf-MWSy4_brA",
      "name": "ESPN Fantasy Football",
      "maxResults": 25
    }
  ]
}
```

## Data Processing

### Video to Resource Conversion

Each YouTube video is converted to a Resource document with the following mapping:

| YouTube Field | Resource Field | Notes |
|---------------|----------------|-------|
| `snippet.title` | `title` | Video title |
| `snippet.description` | `description` | Video description |
| `id` | `url` | YouTube watch URL |
| `snippet.thumbnails` | `image` | Best available thumbnail |
| `id` | `videoUrl` | YouTube watch URL |
| `snippet.channelTitle` | `author` | Channel name |
| - | `source` | Always "YouTube" |
| - | `category` | Always "Video" |
| `snippet.tags` | `tags` | Video tags |
| `snippet.publishedAt` | `pubDate` | Publication date |
| - | `fetchedAt` | Current timestamp |
| Full video object | `rawFeedItem` | Complete YouTube data |
| Extracted keywords | `keywords` | Player names, teams, fantasy terms |

### Keyword Extraction

The system automatically extracts keywords from video titles and descriptions:

- **Player Names**: Joe Burrow, Christian McCaffrey, etc.
- **Team Names**: Bengals, Chiefs, Bills, etc.
- **Fantasy Terms**: start/sit, waiver wire, rankings, etc.

### Duplicate Prevention

- Uses unique constraint on `url` field
- Updates existing videos instead of creating duplicates
- Tracks new vs. updated videos in ingestion results

## Predefined Channels

### Fantasy Football Channels

1. **ESPN Fantasy Football** (`UCq-Fj5jknLsUf-MWSy4_brA`)
   - Official ESPN fantasy content
   - 25 videos per ingestion

2. **Fantasy Footballers** (`UCWJ2lWNubArHWmf3FIHbfcQ`)
   - Popular fantasy football podcast
   - 25 videos per ingestion

3. **FantasyPros** (`UCBqJ7CbQqdPz0dOjT8nCv8A`)
   - Professional fantasy advice
   - 20 videos per ingestion

4. **CBS Sports Fantasy** (`UCYwVQJt9uQmIRxXut9cWP5A`)
   - CBS fantasy content
   - 20 videos per ingestion

5. **NFL Fantasy** (`UCZgxJbLh5LVv2pBA7m2bxSw`)
   - Official NFL fantasy content
   - 20 videos per ingestion

## Usage Examples

### Testing the Setup

```bash
# Test YouTube API connection
curl http://localhost:3000/api/youtube/test

# Get ingestion statistics
curl http://localhost:3000/api/youtube/ingest
```

### Manual Ingestion

```bash
# Ingest from default channels
curl -X POST http://localhost:3000/api/youtube/ingest

# Ingest from specific channel
curl -X POST http://localhost:3000/api/youtube/ingest \
  -H "Content-Type: application/json" \
  -d '{"channelId": "UCq-Fj5jknLsUf-MWSy4_brA", "maxResults": 10}'

# Ingest from channel username
curl -X POST http://localhost:3000/api/youtube/ingest \
  -H "Content-Type: application/json" \
  -d '{"channelUsername": "ESPNFantasyFootball", "maxResults": 10}'
```

### PowerShell Examples

```powershell
# Test API connection
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/youtube/test" -Method GET
$data = $response.Content | ConvertFrom-Json
$data.success

# Trigger ingestion
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/youtube/ingest" -Method POST
$data = $response.Content | ConvertFrom-Json
$data.result.newVideos
```

## Error Handling

### Common Errors

1. **API Key Missing**
   ```
   Error: YOUTUBE_API_KEY environment variable is required
   ```
   - Solution: Add YOUTUBE_API_KEY to .env.local

2. **Channel Not Found**
   ```
   Error: Channel not found: [channel_id]
   ```
   - Solution: Verify channel ID is correct

3. **API Quota Exceeded**
   ```
   Error: YouTube Data API quota exceeded
   ```
   - Solution: Wait for quota reset or upgrade API plan

4. **Database Connection Error**
   ```
   Error: Database connection error
   ```
   - Solution: Check MONGODB_URI environment variable

### Error Response Format

```json
{
  "success": false,
  "error": "Error description",
  "timestamp": "2024-12-15T10:30:00Z"
}
```

## Monitoring and Maintenance

### Logging

The system provides comprehensive console logging:

- API connection status
- Channel processing progress
- Video processing results
- Error details

### Statistics

Track ingestion performance:

- Total videos processed
- New vs. updated videos
- Error rates
- Channel-specific metrics

### Health Checks

Use the test endpoint to verify:

- API key validity
- Channel accessibility
- Data conversion accuracy

## Security Considerations

### API Key Security

- Store API key in environment variables
- Never commit API keys to version control
- Use different keys for development/production
- Monitor API usage and quotas

### Rate Limiting

- YouTube API has daily quotas
- Implement appropriate delays between requests
- Monitor quota usage in Google Cloud Console

### Data Validation

- Validate all incoming YouTube data
- Sanitize user inputs
- Implement proper error handling

## Troubleshooting

### API Connection Issues

1. Verify API key is correct
2. Check network connectivity
3. Ensure API is enabled in Google Cloud Console
4. Verify quota limits

### Database Issues

1. Check MongoDB connection string
2. Verify database permissions
3. Check for duplicate key errors
4. Monitor database performance

### Performance Issues

1. Reduce maxResults parameter
2. Implement pagination for large datasets
3. Add appropriate indexes
4. Monitor API response times

## Future Enhancements

### Planned Features

1. **Scheduled Ingestion**
   - Automated daily/weekly ingestion
   - Cron job integration

2. **Advanced Filtering**
   - Date range filtering
   - Content type filtering
   - Quality scoring

3. **Enhanced Analytics**
   - View count tracking
   - Engagement metrics
   - Trending content identification

4. **Multi-Platform Support**
   - Twitter/X integration
   - Reddit integration
   - Podcast RSS feeds

### API Improvements

1. **Batch Processing**
   - Process multiple channels simultaneously
   - Improved error recovery

2. **Caching**
   - Cache channel information
   - Reduce API calls

3. **Webhooks**
   - Real-time video notifications
   - Automatic ingestion triggers
