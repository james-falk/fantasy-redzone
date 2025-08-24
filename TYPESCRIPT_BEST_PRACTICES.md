# TypeScript Best Practices

This document outlines TypeScript best practices for the Fantasy Red Zone project to prevent build errors and maintain code quality.

## 🚫 **Avoid `any` Type**

### ❌ **Don't Do This:**
```typescript
function processData(data: any): any {
  return data.someProperty;
}
```

### ✅ **Do This Instead:**
```typescript
interface DataType {
  someProperty: string;
}

function processData(data: DataType): string {
  return data.someProperty;
}
```

## 📝 **Proper Interface Definitions**

### ✅ **Good Interface Design:**
```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  timestamp: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}
```

## 🔧 **Type Safety for API Responses**

### ✅ **Proper API Response Handling:**
```typescript
interface RefreshCheckResponse {
  newDataAvailable: boolean;
  lastCheckTime: string;
  currentTime: string;
  resourceCount: number;
  youtubeVideosCount: number;
  lastResourceTime: string | null;
  timeSinceLastResource: number | null;
  schedulerState: {
    lastIngestionTime: string | null;
    lastIngestionStatus: 'success' | 'failed' | 'pending';
    nextScheduledTime: string;
    totalIngestions: number;
    successfulIngestions: number;
    failedIngestions: number;
  } | null;
}
```

## 🎯 **Union Types for Status Fields**

### ✅ **Use Union Types for Status:**
```typescript
type IngestionStatus = 'success' | 'failed' | 'pending';
type SchedulerStatus = 'running' | 'stopped' | 'error';

interface SchedulerState {
  status: SchedulerStatus;
  lastIngestionStatus: IngestionStatus;
}
```

## 📦 **Import/Export Best Practices**

### ✅ **Proper Import/Export:**
```typescript
// Export interfaces and types
export interface IngestionResult {
  success: boolean;
  totalVideos: number;
  newVideos: number;
  updatedVideos: number;
  skippedVideos: number;
  errors: string[];
}

// Export classes as default
export default class YouTubeIngestionService {
  // implementation
}

// Import with proper typing
import YouTubeIngestionService, { IngestionResult } from './youtube-ingestion';
```

## 🔍 **Type Guards and Validation**

### ✅ **Use Type Guards:**
```typescript
function isIngestionResult(obj: unknown): obj is IngestionResult {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'success' in obj &&
    'totalVideos' in obj &&
    'newVideos' in obj
  );
}

function processResult(result: unknown): IngestionResult | null {
  if (isIngestionResult(result)) {
    return result;
  }
  return null;
}
```

## 🛡️ **Error Handling with Types**

### ✅ **Typed Error Handling:**
```typescript
interface ApiError {
  message: string;
  code: string;
  timestamp: string;
}

async function safeApiCall<T>(apiFunction: () => Promise<T>): Promise<T | ApiError> {
  try {
    return await apiFunction();
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: 'API_ERROR',
      timestamp: new Date().toISOString()
    };
  }
}
```

## 📋 **Checklist Before Committing**

Before committing code, ensure:

- [ ] No `any` types are used (unless absolutely necessary with explicit comment)
- [ ] All interfaces are properly defined
- [ ] Union types are used for status/enum-like fields
- [ ] Import/export statements are correct
- [ ] Type guards are used for unknown data
- [ ] Error handling includes proper typing
- [ ] ESLint passes without TypeScript errors

## 🚨 **Common Pitfalls to Avoid**

1. **Using `any` instead of proper types**
2. **Not defining interfaces for API responses**
3. **Using string literals instead of union types**
4. **Incorrect import/export patterns**
5. **Not handling null/undefined cases**
6. **Using type assertions without validation**

## 🔧 **ESLint Configuration**

The project uses strict ESLint rules:

```javascript
{
  '@typescript-eslint/no-explicit-any': ['error', {
    ignoreRestArgs: true,
    fixToUnknown: false,
  }],
  '@typescript-eslint/prefer-const': 'error',
  '@typescript-eslint/no-unnecessary-type-assertion': 'error',
  '@typescript-eslint/no-non-null-assertion': 'warn',
}
```

## 📚 **Resources**

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TypeScript ESLint Rules](https://typescript-eslint.io/rules/)
- [Next.js TypeScript Guide](https://nextjs.org/docs/basic-features/typescript)
