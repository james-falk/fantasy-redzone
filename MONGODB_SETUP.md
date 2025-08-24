# MongoDB Database Setup & Configuration

## Database Information

- **Database Name**: `fantasyredzone`
- **Cluster**: MongoDB Atlas (fantasy-redzone.e9curud.mongodb.net)
- **Connection String**: `mongodb+srv://james:mOz8wKkPYDWFjsw3@fantasy-redzone.e9curud.mongodb.net/fantasyredzone?retryWrites=true&w=majority&appName=fantasy-redzone`

## Environment Variables

### Local Development (.env.local)
```bash
MONGODB_URI=mongodb+srv://james:mOz8wKkPYDWFjsw3@fantasy-redzone.e9curud.mongodb.net/fantasyredzone?retryWrites=true&w=majority&appName=fantasy-redzone
```

### Production (Vercel)
Set the same `MONGODB_URI` environment variable in your Vercel project settings.

## Resource Schema

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | String | ✅ | Resource title |
| `description` | String | ❌ | Resource description (default: "") |
| `url` | String | ✅ | Unique resource URL |
| `image` | String | ❌ | Image URL with fallback logic |
| `audioUrl` | String | ❌ | Audio file URL |
| `videoUrl` | String | ❌ | Video file URL |
| `source` | String | ✅ | Platform source (e.g., "ESPNFantasyFootball", "YouTube") |
| `author` | String | ❌ | Author name or content creator |
| `category` | String | ✅ | Content type ("Article", "Video", "Podcast", etc.) |
| `tags` | Array[String] | ❌ | Flexible labels (default: []) |
| `pubDate` | Date | ✅ | Publication date |
| `fetchedAt` | Date | ✅ | When resource was fetched (auto-generated) |
| `rawFeedItem` | Mixed | ❌ | Original feed data |
| `favoritedBy` | Array[ObjectId] | ❌ | User IDs who favorited |
| `creatorId` | ObjectId | ❌ | User who created the resource |
| `isActive` | Boolean | ❌ | Active status (default: true) |
| `createdAt` | Date | ✅ | Creation timestamp (auto-generated) |
| `updatedAt` | Date | ✅ | Last update timestamp (auto-generated) |

### Fallback Image Logic

The `image` field automatically uses a fallback image if:
- Value is `null` or `undefined`
- Value is an empty string
- Value is not a valid URL

**Fallback Image**: `https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&q=80`

## Database Indexes

### Production Indexes

1. **URL Index** (Unique)
   ```javascript
   { url: 1 } // Unique constraint
   ```

2. **Publication Date Index**
   ```javascript
   { pubDate: -1 } // Sort by newest first
   ```

3. **Category Index**
   ```javascript
   { category: 1 } // Filter by category
   ```

4. **Source Index**
   ```javascript
   { source: 1 } // Filter by source
   ```

5. **Tags Index**
   ```javascript
   { tags: 1 } // Filter by tags
   ```

6. **Active Status Index**
   ```javascript
   { isActive: 1 } // Filter by active status
   ```

7. **Favorites Index**
   ```javascript
   { favoritedBy: 1 } // User favorites queries
   ```

8. **Author Index**
   ```javascript
   { author: 1 } // Filter by author
   ```

9. **Full-Text Search Index**
   ```javascript
   { "title": "text", "description": "text" } // Text search
   ```

## API Endpoints

### Resources Collection

#### GET `/api/resources`
- **Purpose**: Fetch all resources with filtering and pagination
- **Query Parameters**:
  - `page` (number): Page number (default: 1)
  - `limit` (number): Items per page (default: 10)
  - `category` (string): Filter by category
  - `source` (string): Filter by source
  - `search` (string): Search in title, description, and tags
  - `isActive` (boolean): Filter by active status

#### POST `/api/resources`
- **Purpose**: Create a new resource
- **Body**: Resource data object
- **Validation**: Required fields validation
- **Fallback**: Automatic image fallback

#### GET `/api/resources/[id]`
- **Purpose**: Fetch a single resource by ID
- **Parameters**: Resource ID

#### PUT `/api/resources/[id]`
- **Purpose**: Update a resource
- **Parameters**: Resource ID
- **Body**: Updated resource data
- **Validation**: Required fields validation

#### DELETE `/api/resources/[id]`
- **Purpose**: Delete a resource
- **Parameters**: Resource ID

### Database Management

#### GET `/api/cleanup`
- **Purpose**: Show database status
- **Returns**: Resource counts, categories, sources

#### POST `/api/cleanup`
- **Purpose**: Remove test/dummy data
- **Filters**: Removes resources with example.com URLs or test content

#### GET `/api/test-db`
- **Purpose**: Test database connection and schema
- **Returns**: Test resource creation with fallback image validation

## Database Migration

### From Test to Production

1. **Update Connection String**
   - Add `/fantasyredzone` to the database path
   - Update both local and production environment variables

2. **Clean Test Data**
   ```bash
   POST /api/cleanup
   ```

3. **Verify Schema**
   ```bash
   GET /api/test-db
   ```

4. **Check Database Status**
   ```bash
   GET /api/cleanup
   ```

## Maintenance Procedures

### Regular Tasks

1. **Monitor Resource Count**
   ```bash
   GET /api/cleanup
   ```

2. **Clean Duplicate URLs**
   - MongoDB unique index prevents duplicates
   - Monitor for 409 conflicts in API responses

3. **Update Fallback Image**
   - Modify `FALLBACK_IMAGE_URL` in `src/models/Resource.ts`
   - Update `src/utils/resource-helpers.ts`

### Performance Optimization

1. **Index Monitoring**
   - Monitor query performance
   - Add indexes for frequently used filters

2. **Connection Pooling**
   - Mongoose handles connection caching
   - Monitor connection limits in MongoDB Atlas

## Security Considerations

1. **Environment Variables**
   - Never commit `.env.local` to version control
   - Use Vercel environment variables for production

2. **Database Access**
   - Use read-only users for queries when possible
   - Implement proper authentication for write operations

3. **Input Validation**
   - All API endpoints validate input data
   - URL validation for image fields

## Troubleshooting

### Common Issues

1. **Connection Errors**
   - Check `MONGODB_URI` environment variable
   - Verify network connectivity
   - Check MongoDB Atlas IP whitelist

2. **Validation Errors**
   - Ensure all required fields are provided
   - Check data types match schema

3. **Duplicate URL Errors**
   - URL field has unique constraint
   - Check for existing resources before creating

### Debug Endpoints

- `GET /api/test-db`: Test database connectivity
- `GET /api/cleanup`: Check database status
- `GET /api/resources`: List all resources

## Schema Version History

### Version 2.0 (Current)
- Added `author` field
- Enhanced fallback image logic
- Added production indexes
- Added full-text search capability

### Version 1.0 (Previous)
- Basic resource fields
- Simple fallback image
- Basic indexes
