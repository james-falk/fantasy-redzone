# Daily YouTube Ingestion System

## Overview

The Fantasy Red Zone application implements a comprehensive daily YouTube ingestion system that automatically fetches new content from configured YouTube channels at 6:00 AM EST daily. This system ensures fresh content is available while minimizing API usage and server load.

## Architecture

### Components

1. **Daily Scheduler Service** (`src/services/daily-scheduler.ts`)
   - Manages scheduled ingestion timing
   - Handles timezone conversion (EST to UTC)
   - Tracks ingestion state and statistics
   - Logs ingestion results to database

2. **Scheduler API** (`src/app/api/scheduler/route.ts`)
   - Provides scheduler status and state
   - Allows manual ingestion triggers
   - Returns detailed scheduler information

3. **Cron Job API** (`src/app/api/scheduler/cron/route.ts`)
   - Vercel cron job endpoint
   - Authenticated with CRON_SECRET
   - Triggers daily ingestion at scheduled time

4. **Enhanced Refresh Check** (`src/app/api/refresh-check/route.ts`)
   - Checks for new content availability
   - Includes scheduler status information
   - Used by frontend for polling

5. **Frontend Polling** (`src/components/refresh-indicator.tsx`)
   - Polls refresh check API every 30 minutes
   - Shows new content notifications
   - Triggers page refresh when new data detected

## Scheduling Configuration

### Timezone Handling

- **Target Time**: 6:00 AM EST (Eastern Standard Time)
- **UTC Conversion**: 11:00 AM UTC (EST is UTC-5)
- **Cron Schedule**: `0 11 * * *` (daily at 11:00 UTC)

### Vercel Configuration

```json
{
  "crons": [
    {
      "path": "/api/scheduler/cron",
      "schedule": "0 11 * * *"
    }
  ]
}
```

## Environment Variables

### Required for Production

```bash
# YouTube API
YOUTUBE_API_KEY=your_youtube_api_key_here

# Cron Job Security
CRON_SECRET=your_secure_random_string_here

# Database
MONGODB_URI=your_mongodb_connection_string
```

### CRON_SECRET Generation

Generate a secure random string for the CRON_SECRET:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32
```

## API Endpoints

### GET /api/scheduler
Returns current scheduler status and state.

**Response:**
```json
{
  "success": true,
  "message": "Scheduler status retrieved successfully",
  "schedulerState": {
    "lastIngestionTime": "2025-01-15T11:00:00.000Z",
    "lastIngestionStatus": "success",
    "nextScheduledTime": "2025-01-16T11:00:00.000Z",
    "totalIngestions": 15,
    "successfulIngestions": 14,
    "failedIngestions": 1,
    "timeUntilNextIngestion": 86400000
  },
  "environment": "production",
  "timestamp": "2025-01-15T12:30:00.000Z"
}
```

### POST /api/scheduler
Manually triggers daily ingestion (for testing or emergency updates).

### GET /api/scheduler/cron
Vercel cron job endpoint (requires CRON_SECRET authentication).

### GET /api/refresh-check
Enhanced refresh check that includes scheduler information.

**Response:**
```json
{
  "newDataAvailable": false,
  "lastCheckTime": "2025-01-15T12:30:00.000Z",
  "currentTime": "2025-01-15T12:30:00.000Z",
  "resourceCount": 30,
  "youtubeVideosCount": 30,
  "lastResourceTime": "2025-01-15T11:05:00.000Z",
  "timeSinceLastResource": 25,
  "lastIngestionTime": "2025-01-15T11:00:00.000Z",
  "nextScheduledIngestion": "2025-01-16T11:00:00.000Z",
  "schedulerStatus": "success",
  "sources": {
    "youtube": {
      "count": 30,
      "lastUpdate": "2025-01-15T11:05:00.000Z"
    },
    "articles": {
      "count": 0,
      "lastUpdate": null
    }
  }
}
```

## Frontend Integration

### Polling Configuration

- **Polling Interval**: 30 minutes (configurable)
- **Status Display**: Hidden by default (no visual noise)
- **New Content Alerts**: Shown when new data detected
- **Manual Refresh**: Available via browser refresh

### Component Usage

```tsx
<RefreshIndicator 
  onRefresh={handleRefresh}
  pollingInterval={30 * 60 * 1000} // 30 minutes
  showStatus={false}
  className="mb-4"
/>
```

## Monitoring and Logging

### Scheduler Logs

The system provides comprehensive logging for monitoring:

```
🕐 [CRON] Daily ingestion cron job triggered
🔄 [SCHEDULER] Starting daily YouTube ingestion
✅ [SCHEDULER] Daily ingestion completed successfully
📝 [SCHEDULER] Ingestion logged to database
```

### Database Logging

Ingestion results are logged to the database as system resources:

- **Title**: `Daily Ingestion Log - {date}`
- **Source**: `Scheduler`
- **Category**: `System`
- **Tags**: `['scheduler', 'daily-ingestion', 'success'|'failed']`
- **isActive**: `false` (not shown in regular content)

### Error Handling

- Failed ingestions are logged with error details
- Scheduler state tracks success/failure statistics
- Frontend shows error status in development mode
- Manual retry available via API endpoints

## Testing

### Manual Testing

1. **Check Scheduler Status**:
   ```bash
   curl https://your-site.vercel.app/api/scheduler
   ```

2. **Trigger Manual Ingestion**:
   ```bash
   curl -X POST https://your-site.vercel.app/api/scheduler
   ```

3. **Test Refresh Check**:
   ```bash
   curl https://your-site.vercel.app/api/refresh-check
   ```

### Local Development

For local testing, you can:

1. Set up a local cron job or use a tool like `node-cron`
2. Manually trigger ingestion via the API
3. Test the scheduler logic without Vercel cron

## Production Deployment

### Vercel Setup

1. **Set Environment Variables**:
   - `YOUTUBE_API_KEY`
   - `CRON_SECRET` (secure random string)
   - `MONGODB_URI`

2. **Deploy with Cron Configuration**:
   - The `vercel.json` file configures the cron job
   - Vercel automatically sets up the scheduled execution

3. **Monitor Logs**:
   - Check Vercel function logs for cron job execution
   - Monitor database for ingestion logs
   - Verify scheduler status via API

### Security Considerations

- **CRON_SECRET**: Required for cron job authentication
- **API Rate Limits**: YouTube API usage is monitored
- **Database Access**: Secure MongoDB connection
- **Error Handling**: Failed ingestions don't break the system

## Troubleshooting

### Common Issues

1. **Cron Job Not Running**:
   - Verify `CRON_SECRET` is set in Vercel
   - Check Vercel function logs
   - Ensure `vercel.json` is deployed

2. **Ingestion Failures**:
   - Check YouTube API key validity
   - Verify MongoDB connection
   - Review scheduler logs for errors

3. **Frontend Not Updating**:
   - Check refresh check API response
   - Verify polling interval configuration
   - Review browser console for errors

### Debug Commands

```bash
# Check scheduler status
curl https://your-site.vercel.app/api/scheduler

# Test manual ingestion
curl -X POST https://your-site.vercel.app/api/scheduler

# Check refresh status
curl https://your-site.vercel.app/api/refresh-check

# View recent logs (Vercel dashboard)
# Check Function Logs > /api/scheduler/cron
```

## Performance Considerations

- **Efficient Polling**: 30-minute intervals minimize API calls
- **Database Indexing**: Ensure proper indexes on `createdAt` and `source` fields
- **Connection Pooling**: MongoDB connection is cached and reused
- **Error Recovery**: Failed ingestions don't prevent future runs
- **Resource Cleanup**: Proper cleanup of intervals and connections

## Future Enhancements

- **Multiple Time Slots**: Support for multiple ingestion times
- **Channel-Specific Scheduling**: Different schedules per channel
- **Advanced Monitoring**: Dashboard for ingestion statistics
- **Alert System**: Notifications for failed ingestions
- **Backup Scheduling**: Fallback ingestion mechanisms
