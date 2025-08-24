import mongoose from 'mongoose'

/**
 * MongoDB Connection Utility
 * 
 * This module provides a unified database connection that works identically
 * across local development and production environments.
 * 
 * ENVIRONMENT HANDLING:
 * - Local Development: Uses MONGODB_URI from .env.local
 * - Production: Uses MONGODB_URI from Vercel environment variables
 * - Build Time: Gracefully handles missing URI during Next.js build process
 * 
 * CONNECTION CACHING:
 * - Prevents multiple connections in serverless environments
 * - Maintains connection across hot reloads in development
 * - Implements proper connection pooling and timeout handling
 */

const MONGODB_URI = process.env.MONGODB_URI

/**
 * Global cache interface for maintaining connection across hot reloads
 * in development and preventing connection proliferation in serverless environments
 */
interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose | null> | null
}

declare global {
  var mongoose: MongooseCache | undefined
}

const cached: MongooseCache = global.mongoose || { conn: null, promise: null }

if (!global.mongoose) {
  global.mongoose = cached
}

/**
 * Connects to MongoDB using environment-appropriate configuration
 * 
 * @returns Promise<typeof mongoose | null> - Mongoose instance or null if build-time
 * @throws Error - If connection fails in runtime environments
 */
export async function connectToDatabase(): Promise<typeof mongoose | null> {
  const environment = process.env.NODE_ENV || 'development'
  const isProduction = environment === 'production'
  const isVercel = !!process.env.VERCEL_ENV
  
  console.log('🔗 [MONGODB] Connection attempt initiated', {
    environment,
    isVercel,
    hasMongoUri: !!MONGODB_URI,
    mongoUriLength: MONGODB_URI?.length || 0
  })

  // Handle build-time scenarios (Next.js static generation)
  if (isProduction && !MONGODB_URI) {
    console.warn('⚠️ [MONGODB] Build-time: MONGODB_URI not available, skipping connection')
    return null
  }

  // Validate MongoDB URI presence
  if (!MONGODB_URI) {
    const errorMessage = isProduction 
      ? 'MONGODB_URI environment variable is not configured in production'
      : 'Please define the MONGODB_URI environment variable in .env.local for local development'
    
    console.error('❌ [MONGODB] Connection failed:', errorMessage)
    throw new Error(errorMessage)
  }

  // Return cached connection if available
  if (cached.conn) {
    console.log('✅ [MONGODB] Using existing cached connection')
    return cached.conn
  }

  // Create new connection promise if none exists
  if (!cached.promise) {
    console.log('🔄 [MONGODB] Establishing new database connection...')
    
    const connectionOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000, // 5 second timeout for server selection
      socketTimeoutMS: 45000, // 45 second timeout for socket operations
      maxPoolSize: 10, // Maximum number of connections in the pool
      minPoolSize: 1, // Minimum number of connections in the pool
    }

    cached.promise = mongoose.connect(MONGODB_URI, connectionOptions)
      .then((mongoose) => {
        console.log('✅ [MONGODB] Successfully connected to database')
        return mongoose
      })
      .catch((error) => {
        console.error('❌ [MONGODB] Connection failed:', error.message)
        
        // Handle build-time connection failures gracefully
        if (isProduction && isVercel) {
          console.warn('⚠️ [MONGODB] Build-time connection failed, returning null')
          return null
        }
        
        throw error
      })
  }

  try {
    console.log('⏳ [MONGODB] Waiting for connection to establish...')
    cached.conn = await cached.promise
    
    // Handle null connection from build-time scenarios
    if (!cached.conn) {
      console.warn('⚠️ [MONGODB] Connection returned null (likely build-time)')
      return null
    }
    
    console.log('✅ [MONGODB] Database connection ready')
    return cached.conn
    
  } catch (error) {
    console.error('❌ [MONGODB] Connection error:', error)
    cached.promise = null
    
    // Handle build-time errors gracefully
    if (isProduction && isVercel) {
      console.warn('⚠️ [MONGODB] Build-time connection error, returning null')
      return null
    }
    
    throw error
  }
}

/**
 * Disconnects from MongoDB (useful for testing or cleanup)
 */
export async function disconnectFromDatabase(): Promise<void> {
  if (cached.conn) {
    await mongoose.disconnect()
    cached.conn = null
    cached.promise = null
    console.log('🔌 [MONGODB] Database connection closed')
  }
}
