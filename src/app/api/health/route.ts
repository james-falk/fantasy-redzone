import { NextRequest, NextResponse } from 'next/server'

// Health check endpoint to monitor all system components
export async function GET(request: NextRequest) {
  const healthCheckId = `health_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const startTime = Date.now()
  
  try {
    console.log(`🏥 [${healthCheckId}] Starting comprehensive health check...`)
    
    // Check environment variables
    const envCheck = {
      hasNextPublicSiteUrl: !!process.env.NEXT_PUBLIC_SITE_URL,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasMongoDbUri: !!process.env.MONGODB_URI,
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'not-configured'
    }
    
    // Test internal API endpoints
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const endpointTests = []
    
    // Test debug endpoint
    try {
      console.log(`🔍 [${healthCheckId}] Testing debug endpoint...`)
      const debugResponse = await fetch(`${baseUrl}/api/debug`, {
        signal: AbortSignal.timeout(10000)
      })
      
      const debugData = debugResponse.ok ? await debugResponse.json() : null
      
      endpointTests.push({
        endpoint: '/api/debug',
        status: debugResponse.status,
        ok: debugResponse.ok,
        error: debugData?.error || null
      })
    } catch (error) {
      endpointTests.push({
        endpoint: '/api/debug',
        status: 0,
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
    
    // Calculate overall health
    const workingEndpoints = endpointTests.filter(test => test.ok).length
    const totalEndpoints = endpointTests.length
    const healthScore = Math.round((workingEndpoints / totalEndpoints) * 100)
    
    const duration = Date.now() - startTime
    
    console.log(`🏥 [${healthCheckId}] Health check complete: ${healthScore}% (${workingEndpoints}/${totalEndpoints} endpoints working) in ${duration}ms`)
    
    return NextResponse.json({
      success: true,
      healthCheckId,
      timestamp: new Date().toISOString(),
      duration,
      healthScore,
      summary: {
        workingEndpoints,
        totalEndpoints,
        overallStatus: healthScore >= 75 ? 'healthy' : healthScore >= 50 ? 'degraded' : 'unhealthy'
      },
      environment: envCheck,
      endpoints: endpointTests,
      recommendations: generateRecommendations(envCheck, endpointTests)
    })
    
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`❌ [${healthCheckId}] Health check failed:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration
    })
    
    return NextResponse.json({
      success: false,
      healthCheckId,
      timestamp: new Date().toISOString(),
      duration,
      error: error instanceof Error ? error.message : 'Health check failed',
      healthScore: 0,
      summary: {
        workingEndpoints: 0,
        totalEndpoints: 0,
        overallStatus: 'critical'
      }
    }, { status: 500 })
  }
}

function generateRecommendations(envCheck: Record<string, unknown>, endpointTests: Array<{ endpoint: string; ok: boolean; [key: string]: unknown }>): string[] {
  const recommendations: string[] = []
  
  // Environment variable recommendations
  if (!envCheck.hasNextPublicSiteUrl) {
    recommendations.push('Set NEXT_PUBLIC_SITE_URL environment variable for proper API calls')
  }
  
  if (!envCheck.hasNextAuthUrl) {
    recommendations.push('Set NEXTAUTH_URL environment variable for NextAuth.js configuration')
  }
  
  if (!envCheck.hasNextAuthSecret) {
    recommendations.push('Set NEXTAUTH_SECRET environment variable for NextAuth.js security')
  }
  
  if (!envCheck.hasMongoDbUri) {
    recommendations.push('Set MONGODB_URI environment variable for database connectivity')
  }
  
  if (!envCheck.hasGoogleClientId || !envCheck.hasGoogleClientSecret) {
    recommendations.push('Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET for Google OAuth authentication')
  }
  
  // Endpoint-specific recommendations
  const failedDebug = endpointTests.find(test => test.endpoint === '/api/debug' && !test.ok)
  if (failedDebug) {
    recommendations.push('Debug endpoint is failing. Check server logs for more details')
  }
  
  return recommendations
}
