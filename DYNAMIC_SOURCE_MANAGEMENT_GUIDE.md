# Dynamic Source Management System

## Overview

The Dynamic Source Management System allows you to manage YouTube channels and RSS feeds dynamically through a database-driven approach. This system replaces the hardcoded channel configurations with a flexible, admin-manageable solution.

## Architecture

### Core Components

1. **FeedSource Model** (`/models/FeedSource.ts`)
   - MongoDB schema for storing feed source configurations
   - Supports both YouTube and RSS feed types
   - Includes validation, indexing, and utility methods

2. **FeedSourceManager Service** (`/services/feed-source-manager.ts`)
   - Service layer for managing feed sources
   - Provides methods for CRUD operations, statistics, and ingestion tracking

3. **Admin API Routes** (`/api/feedsources/`)
   - RESTful API endpoints for managing feed sources
   - Supports filtering, pagination, and bulk operations

4. **Updated YouTube Ingestion** (`/services/youtube-ingestion.ts`)
   - Enhanced to use feed sources from the database
   - Supports multiple ingestion modes and error tracking

## Database Schema

### FeedSource Collection

```typescript
interface IFeedSource {
  type: "youtube" | "rss"           // Required: Source type
  identifier: string                // Required: Channel ID (YouTube) or RSS URL
  name: string                      // Required: Human-readable name
  enabled: boolean                  // Default: true - Whether to include in ingestion
  description?: string              // Optional description
  category?: string                 // Optional category for grouping
  maxResults?: number               // Default: 25 - Max items to fetch
  lastIngested?: Date               // Last successful ingestion timestamp
  errorCount: number                // Default: 0 - Number of consecutive errors
  lastError?: string                // Last error message
  createdAt: Date                   // Auto-generated timestamp
  updatedAt: Date                   // Auto-generated timestamp
}
```

### Indexes

- `type` (single field)
- `identifier` (unique)
- `enabled` (single field)
- `type + enabled` (compound)
- `category + enabled` (compound)

## API Endpoints

### Feed Sources Management

#### List Feed Sources
```http
GET /api/feedsources?page=1&limit=50&type=youtube&category=Fantasy Football
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50, max: 100)
- `type`: Filter by type (`youtube` or `rss`)
- `category`: Filter by category

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "68ab531aee5a36294df1046a",
      "type": "youtube",
      "identifier": "UCWJ2lWNubArHWmf3FIHbfcQ",
      "name": "Fantasy Footballers",
      "enabled": true,
      "description": "Popular fantasy football podcast",
      "category": "Fantasy Football",
      "maxResults": 25,
      "errorCount": 0,
      "lastIngested": "2025-08-24T18:00:05.829Z",
      "createdAt": "2025-08-24T17:59:54.635Z",
      "updatedAt": "2025-08-24T18:00:05.829Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 6,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

#### Create Feed Source
```http
POST /api/feedsources
Content-Type: application/json

{
  "type": "youtube",
  "identifier": "UCWJ2lWNubArHWmf3FIHbfcQ",
  "name": "Fantasy Footballers",
  "description": "Popular fantasy football podcast",
  "category": "Fantasy Football",
  "maxResults": 25,
  "enabled": true
}
```

#### Update Feed Source
```http
PUT /api/feedsources/68ab531aee5a36294df1046a
Content-Type: application/json

{
  "name": "Updated Fantasy Footballers",
  "maxResults": 30,
  "enabled": false
}
```

#### Delete Feed Source
```http
DELETE /api/feedsources/68ab531aee5a36294df1046a
```

#### Bulk Operations
```http
POST /api/feedsources/bulk
Content-Type: application/json

{
  "sources": [
    {
      "type": "youtube",
      "identifier": "UCWJ2lWNubArHWmf3FIHbfcQ",
      "name": "Fantasy Footballers",
      "category": "Fantasy Football"
    }
  ]
}
```

```http
PUT /api/feedsources/bulk
Content-Type: application/json

{
  "operations": [
    {
      "action": "enable",
      "ids": ["68ab531aee5a36294df1046a"]
    },
    {
      "action": "disable",
      "ids": ["68ab531aee5a36294df1046e"]
    },
    {
      "action": "delete",
      "ids": ["68ab531aee5a36294df10472"]
    }
  ]
}
```

### Feed Source Seeding

#### Seed Default Sources
```http
POST /api/feedsources/seed
```

This endpoint seeds the database with default fantasy football YouTube channels and RSS feeds.

### Enhanced YouTube Ingestion

#### Ingest from All Enabled Sources
```http
POST /api/youtube/ingest
Content-Type: application/json

{
  "mode": "all"
}
```

#### Ingest from Sources Needing Ingestion
```http
POST /api/youtube/ingest
Content-Type: application/json

{
  "mode": "needing-ingestion",
  "hoursThreshold": 24
}
```

#### Ingest from Specific Sources
```http
POST /api/youtube/ingest
Content-Type: application/json

{
  "mode": "sources",
  "sourceIds": ["68ab531aee5a36294df1046a", "68ab531aee5a36294df1046e"]
}
```

#### Legacy Modes (Backward Compatibility)
```http
POST /api/youtube/ingest
Content-Type: application/json

{
  "mode": "channel",
  "channelId": "UCWJ2lWNubArHWmf3FIHbfcQ"
}
```

```http
POST /api/youtube/ingest
Content-Type: application/json

{
  "mode": "username",
  "channelUsername": "fantasyfootballers"
}
```

```http
POST /api/youtube/ingest
Content-Type: application/json

{
  "mode": "legacy",
  "channels": [
    {
      "id": "UCWJ2lWNubArHWmf3FIHbfcQ",
      "name": "Fantasy Footballers",
      "maxResults": 25
    }
  ]
}
```

## Usage Examples

### 1. Setting Up Feed Sources

First, seed the database with default sources:

```bash
curl -X POST http://localhost:3000/api/feedsources/seed
```

### 2. Adding a New YouTube Channel

```bash
curl -X POST http://localhost:3000/api/feedsources \
  -H "Content-Type: application/json" \
  -d '{
    "type": "youtube",
    "identifier": "UCWJ2lWNubArHWmf3FIHbfcQ",
    "name": "Fantasy Footballers",
    "description": "Popular fantasy football podcast",
    "category": "Fantasy Football",
    "maxResults": 25,
    "enabled": true
  }'
```

### 3. Running Ingestion

Ingest from all enabled sources:

```bash
curl -X POST http://localhost:3000/api/youtube/ingest \
  -H "Content-Type: application/json" \
  -d '{"mode": "all"}'
```

### 4. Monitoring Sources

Check which sources need ingestion:

```bash
curl http://localhost:3000/api/youtube/ingest
```

### 5. Managing Sources

List all sources:

```bash
curl http://localhost:3000/api/feedsources
```

Disable a problematic source:

```bash
curl -X PUT http://localhost:3000/api/feedsources/68ab531aee5a36294df1046e \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'
```

## Error Handling

### Automatic Error Tracking

The system automatically tracks errors for each feed source:

- `errorCount`: Increments on each failed ingestion
- `lastError`: Stores the most recent error message
- `lastIngested`: Updated on successful ingestion

### Error Recovery

Sources with errors are automatically retried on subsequent ingestion runs. You can:

1. **Monitor errors** via the API responses
2. **Disable problematic sources** temporarily
3. **Update source configurations** (e.g., fix channel IDs)
4. **Re-enable sources** after fixing issues

### Common Error Scenarios

1. **Invalid Channel ID**: "Channel not found" errors
   - Solution: Verify the channel ID and update the source

2. **API Rate Limits**: YouTube API quota exceeded
   - Solution: Reduce `maxResults` or implement rate limiting

3. **Network Issues**: Temporary connection problems
   - Solution: Retry automatically on next ingestion run

## Best Practices

### 1. Source Management

- Use descriptive names and categories for easy organization
- Set appropriate `maxResults` based on source activity
- Monitor error counts and address persistent issues

### 2. Ingestion Strategy

- Use `mode: "needing-ingestion"` for regular updates
- Use `mode: "all"` for full refresh when needed
- Monitor ingestion statistics for performance

### 3. Error Handling

- Regularly check sources with high error counts
- Disable problematic sources temporarily
- Update source configurations as needed

### 4. Performance

- Use pagination when listing large numbers of sources
- Implement appropriate `maxResults` limits
- Monitor ingestion duration and success rates

## Migration from Legacy System

The new system maintains backward compatibility with the legacy YouTube ingestion:

1. **Legacy API calls** still work with `mode: "legacy"`
2. **Existing channel configurations** can be migrated to feed sources
3. **Gradual migration** is supported - you can use both systems simultaneously

### Migration Steps

1. Seed default feed sources
2. Test with new ingestion modes
3. Migrate custom channel configurations to feed sources
4. Update application code to use new APIs
5. Remove legacy configurations

## Future Enhancements

### Planned Features

1. **RSS Feed Ingestion**: Complete RSS feed processing pipeline
2. **Admin UI**: Web interface for managing feed sources
3. **Scheduled Ingestion**: Automated ingestion at regular intervals
4. **Advanced Filtering**: More sophisticated source filtering options
5. **Analytics Dashboard**: Detailed ingestion statistics and monitoring

### Extensibility

The system is designed to be easily extensible:

- Add new source types (e.g., Twitter, Instagram)
- Implement custom validation rules
- Add advanced error handling strategies
- Integrate with external monitoring systems

## Troubleshooting

### Common Issues

1. **Sources not being ingested**
   - Check if sources are enabled
   - Verify source identifiers are correct
   - Check for API rate limits

2. **High error counts**
   - Review `lastError` messages
   - Verify source configurations
   - Check network connectivity

3. **Performance issues**
   - Reduce `maxResults` values
   - Implement pagination for large datasets
   - Monitor database performance

### Debug Information

Use the GET endpoints to gather debug information:

```bash
# Get feed source statistics
curl http://localhost:3000/api/feedsources/seed

# Get ingestion statistics
curl http://localhost:3000/api/youtube/ingest

# Get specific source details
curl http://localhost:3000/api/feedsources/68ab531aee5a36294df1046a
```

## Support

For issues or questions about the Dynamic Source Management System:

1. Check the error logs in the API responses
2. Review the source configurations
3. Verify YouTube API key and quotas
4. Check MongoDB connection and permissions

The system provides comprehensive logging and error reporting to help diagnose and resolve issues quickly.
