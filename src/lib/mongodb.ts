import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  var mongoose: MongooseCache | undefined
}

const cached: MongooseCache = global.mongoose || { conn: null, promise: null }

if (!global.mongoose) {
  global.mongoose = cached
}

export async function connectToDatabase() {
  console.log('🔗 [MONGODB DEBUG] Attempting database connection...')
  console.log('🔗 [MONGODB DEBUG] Environment:', {
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    hasMongoUri: !!MONGODB_URI,
    mongoUriLength: MONGODB_URI?.length || 0
  })

  // Check if we're in a build environment and skip connection
  if (process.env.NODE_ENV === 'production' && !MONGODB_URI) {
    console.warn('⚠️ [MONGODB DEBUG] MONGODB_URI not available during build time, skipping connection')
    return null
  }

  if (!MONGODB_URI) {
    console.error('❌ [MONGODB DEBUG] MONGODB_URI environment variable is missing')
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local')
  }

  if (cached.conn) {
    console.log('✅ [MONGODB DEBUG] Using cached connection')
    return cached.conn
  }

  if (!cached.promise) {
    console.log('🔄 [MONGODB DEBUG] Creating new connection promise...')
    const opts = {
      bufferCommands: false,
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('✅ [MONGODB DEBUG] Successfully connected to MongoDB')
      return mongoose
    }).catch((error) => {
      console.error('❌ [MONGODB DEBUG] MongoDB connection failed:', error.message)
      throw error
    })
  }

  try {
    console.log('⏳ [MONGODB DEBUG] Waiting for connection...')
    cached.conn = await cached.promise
    console.log('✅ [MONGODB DEBUG] Connection established successfully')
  } catch (e) {
    console.error('❌ [MONGODB DEBUG] Connection error:', e)
    cached.promise = null
    throw e
  }

  return cached.conn
}
