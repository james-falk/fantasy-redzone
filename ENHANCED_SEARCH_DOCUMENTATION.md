# Enhanced Search Documentation

## Overview

The Fantasy Red Zone application now includes robust keyword search functionality that combines MongoDB text search with intelligent keyword extraction and matching. This system automatically identifies player names, team names, and fantasy football terms from content and enables powerful search capabilities.

## Schema Updates

### New Keywords Field

The `Resource` schema has been enhanced with a new `keywords` field:

```typescript
keywords: string[];  // Extracted important terms like player names, teams, fantasy football keywords
```

**Purpose**: Stores automatically extracted keywords from the title and description of each resource.

**Default**: Empty array `[]`

**Index**: Single-field index for efficient keyword queries

### Updated Schema Version

- **Version**: 2.1
- **New Features**: 
  - Keyword extraction
  - Enhanced search capabilities
  - Text search with relevance scoring

## Keyword Extraction System

### Automatic Keyword Detection

The system automatically extracts keywords from resource titles and descriptions, identifying:

#### 1. Player Names
- **Top Quarterbacks**: Joe Burrow, Patrick Mahomes, Josh Allen, Justin Herbert, Lamar Jackson
- **Top Running Backs**: Christian McCaffrey, Austin Ekeler, Derrick Henry, Nick Chubb, Saquon Barkley
- **Top Wide Receivers**: Tyreek Hill, Justin Jefferson, Davante Adams, Stefon Diggs, AJ Brown
- **Top Tight Ends**: Travis Kelce, Mark Andrews, George Kittle, Darren Waller, Kyle Pitts

#### 2. Team Names
- **All 32 NFL Teams**: Bengals, Chiefs, Bills, Chargers, Ravens, Eagles, Cowboys, etc.

#### 3. Fantasy Football Terms
- **Scoring**: PPR, Standard, Half PPR, Fantasy Points
- **Content Types**: Start/Sit, Waiver Wire, Rankings, Sleepers, Busts
- **Injury Status**: Injury, Out, Questionable, Doubtful, Probable
- **Game Terms**: Touchdown, Passing Yards, Rushing Yards, Receiving Yards
- **League Types**: Dynasty, Redraft, Keeper, Auction
- **Draft Terms**: Mock Draft, ADP, Average Draft Position, Bye Week

### Keyword Extraction Logic

```typescript
export function extractKeywords(title: string, description: string = ""): string[]
```

**Process**:
1. Combines title and description into single text
2. Converts to lowercase for matching
3. Checks against predefined player names, team names, and fantasy terms
4. Uses regex patterns to identify potential player names (First Last format)
5. Removes duplicates and normalizes keywords
6. Returns array of unique, lowercase keywords

## Search Functionality

### Enhanced Search Query Builder

```typescript
export function buildSearchQuery(searchTerm: string): Record<string, unknown>
```

**Search Strategy**:
- **Text Search**: MongoDB `$text` search on title and description
- **Exact Keyword Matching**: `keywords: { $in: [searchTerm] }`
- **Partial Keyword Matching**: `keywords: { $regex: searchTerm, $options: 'i' }`
- **Tag Matching**: Exact and partial tag matching
- **Combined Results**: Uses `$or` to combine all search methods

### Search API Endpoints

#### 1. Enhanced Resources API (`/api/resources`)

**GET Parameters**:
- `search`: General search term (uses enhanced search logic)
- `keywords`: Comma-separated specific keywords to match
- `category`: Filter by category
- `source`: Filter by source
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Example**:
```
GET /api/resources?search=joe burrow&category=Injury Report&page=1&limit=5
```

#### 2. Dedicated Search API (`/api/search`)

**GET Parameters**:
- `q`: Required search query
- `category`: Filter by category
- `source`: Filter by source
- `keywords`: Comma-separated specific keywords
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Features**:
- Text relevance scoring
- Search result enhancement with relevance information
- Combined text and keyword search

**Example**:
```
GET /api/search?q=joe burrow&category=Injury Report
```

### Search Response Format

```json
{
  "success": true,
  "query": "joe burrow",
  "data": [
    {
      "id": "...",
      "title": "Joe Burrow Injury Update: Bengals QB Status for Week 16",
      "description": "...",
      "keywords": ["joe burrow", "bengals", "injury", "quarterback"],
      "searchRelevance": {
        "hasExactKeywordMatch": true,
        "hasTextMatch": true,
        "keywordMatches": ["joe burrow", "bengals"]
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "pages": 1
  },
  "search": {
    "term": "joe burrow",
    "filters": {
      "category": "Injury Report",
      "source": null,
      "keywords": null
    }
  }
}
```

## Database Indexes

### Text Search Index
```javascript
ResourceSchema.index({ "title": "text", "description": "text" });
```
- Enables full-text search on title and description
- Supports relevance scoring
- Case-insensitive search

### Keyword Index
```javascript
ResourceSchema.index({ keywords: 1 });
```
- Optimizes keyword-based queries
- Supports exact and partial keyword matching
- Enables efficient `$in` operations

### Combined Indexes
- **URL**: Unique constraint
- **Publication Date**: Sorting optimization
- **Category**: Filter optimization
- **Source**: Filter optimization
- **Tags**: Filter optimization
- **Active Status**: Filter optimization
- **Author**: Filter optimization

## Usage Examples

### 1. Search for Player Names
```bash
# Search for Joe Burrow
GET /api/search?q=joe burrow

# Search with category filter
GET /api/search?q=christian mccaffrey&category=Rankings
```

### 2. Search for Teams
```bash
# Search for Bengals content
GET /api/search?q=bengals

# Search for team with specific keywords
GET /api/search?q=chiefs&keywords=patrick mahomes,travis kelce
```

### 3. Search for Fantasy Terms
```bash
# Search for waiver wire content
GET /api/search?q=waiver wire

# Search for injury updates
GET /api/search?q=injury&category=Injury Report
```

### 4. Combined Search
```bash
# Search for specific player in specific category
GET /api/search?q=tyreek hill&category=Start/Sit&source=FantasyPros
```

## Testing

### Test API Endpoint

The `/api/test-db` endpoint demonstrates keyword extraction:

```bash
GET /api/test-db
```

**Response includes**:
- Keyword extraction demonstration
- Sample extracted keywords
- Schema version and features
- Test resource with keywords

### Manual Testing

1. **Create Resource with Keywords**:
   ```bash
   POST /api/resources
   {
     "title": "Joe Burrow Injury Update: Bengals QB Status",
     "description": "Latest on Joe Burrow and Bengals offense...",
     "url": "https://example.com/burrow-update",
     "source": "FantasyPros",
     "category": "Injury Report",
     "pubDate": "2024-12-16T09:00:00.000Z"
   }
   ```

2. **Search for Extracted Keywords**:
   ```bash
   GET /api/search?q=joe burrow
   GET /api/search?q=bengals
   GET /api/search?q=injury
   ```

## Performance Considerations

### Index Optimization
- Text index on title and description for relevance scoring
- Single-field index on keywords for exact matching
- Compound indexes for common filter combinations

### Query Optimization
- Uses MongoDB's text search for relevance ranking
- Combines multiple search strategies for better recall
- Implements pagination for large result sets

### Caching Strategy
- Consider implementing Redis caching for frequent searches
- Cache popular search results and keyword extractions
- Implement search result caching with TTL

## Future Enhancements

### 1. Dynamic Keyword Database
- Store player names and teams in database
- Allow admin updates to keyword lists
- Implement keyword popularity tracking

### 2. Advanced Search Features
- Fuzzy matching for typos
- Synonym matching (e.g., "QB" matches "quarterback")
- Search result highlighting
- Search suggestions/autocomplete

### 3. Machine Learning Integration
- Train models on fantasy football content
- Improve keyword extraction accuracy
- Implement content recommendation system

### 4. Search Analytics
- Track popular search terms
- Monitor search performance
- Implement search result click tracking

## Maintenance

### Regular Tasks
1. **Update Player Lists**: Add new players to keyword extraction
2. **Monitor Search Performance**: Check query execution times
3. **Update Team Names**: Add new teams or handle team name changes
4. **Review Search Logs**: Identify popular search patterns

### Database Maintenance
1. **Index Monitoring**: Check index usage and performance
2. **Keyword Cleanup**: Remove outdated or incorrect keywords
3. **Search Optimization**: Tune search queries based on usage patterns

## Troubleshooting

### Common Issues

1. **No Search Results**:
   - Check if text index is created
   - Verify keywords are being extracted
   - Test with simple search terms

2. **Slow Search Performance**:
   - Check index usage with `explain()`
   - Verify text index is properly configured
   - Consider adding compound indexes

3. **Keyword Extraction Issues**:
   - Verify player names are in the extraction list
   - Check for typos in predefined keywords
   - Test extraction function directly

### Debug Endpoints

- `/api/test-db`: Test keyword extraction
- `/api/search?q=test`: Test search functionality
- `/api/resources?search=test`: Test enhanced resources search

---

**Version**: 2.1  
**Last Updated**: August 24, 2025  
**Status**: ✅ Production Ready
