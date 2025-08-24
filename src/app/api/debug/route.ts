import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const envVars = {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ? '✅ Present' : '❌ Missing',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '✅ Present' : '❌ Missing',
      MONGODB_URI: process.env.MONGODB_URI ? '✅ Present' : '❌ Missing',
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? '✅ Present' : '❌ Missing',
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? '✅ Present' : '❌ Missing',
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: envVars,
      message: 'Environment debug info for MongoDB + NextAuth.js architecture'
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Debug failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
