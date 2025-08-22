'use client'

import { useState, useEffect } from 'react'

interface HealthData {
  success: boolean
  healthCheckId: string
  timestamp: string
  duration: number
  healthScore: number
  summary: {
    workingEndpoints: number
    totalEndpoints: number
    overallStatus: 'healthy' | 'degraded' | 'unhealthy' | 'critical'
  }
  environment: {
    hasNextPublicSiteUrl: boolean
    hasCronSecret: boolean
    hasRefreshToken: boolean
    hasYouTubeClientId: boolean
    hasYouTubeClientSecret: boolean
    hasYouTubeRefreshToken: boolean
    hasNewsSourcesConfig: boolean
    siteUrl: string
  }
  endpoints: Array<{
    endpoint: string
    status: number
    ok: boolean
    error?: string
    [key: string]: any
  }>
  recommendations: string[]
}

export default function HealthDashboard() {
  const [healthData, setHealthData] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<string>('')

  const fetchHealthData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/health')
      const data = await response.json()
      setHealthData(data)
      setLastRefresh(new Date().toLocaleTimeString())
    } catch (error) {
      console.error('Failed to fetch health data:', error)
    } finally {
      setLoading(false)
    }
  }

  const triggerRefresh = async () => {
    try {
      const response = await fetch('/api/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_REFRESH_TOKEN || 'default-refresh-token'}`,
          'Content-Type': 'application/json'
        }
      })
      const result = await response.json()
      
      if (result.success) {
        alert(`✅ Refresh completed! ${result.results.successful} successful, ${result.results.failed} failed`)
      } else {
        alert(`❌ Refresh failed: ${result.error}`)
      }
    } catch (error) {
      alert(`❌ Refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  useEffect(() => {
    fetchHealthData()
    const interval = setInterval(fetchHealthData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  if (loading && !healthData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading health data...</p>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100'
      case 'degraded': return 'text-yellow-600 bg-yellow-100'
      case 'unhealthy': return 'text-orange-600 bg-orange-100'
      case 'critical': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getEndpointStatusColor = (ok: boolean) => {
    return ok ? 'text-green-600' : 'text-red-600'
  }

  if (!healthData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Failed to load health data</p>
          <button 
            onClick={fetchHealthData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Fantasy Red Zone - System Health</h1>
          <p className="mt-2 text-gray-600">Monitor system status and troubleshoot issues</p>
          <p className="text-sm text-gray-500">Last updated: {lastRefresh}</p>
        </div>

        {/* Overall Health Score */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(healthData.summary.overallStatus)}`}>
                    {healthData.summary.overallStatus.toUpperCase()}
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Health Score</dt>
                    <dd className="text-lg font-medium text-gray-900">{healthData.healthScore}%</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Working Endpoints</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {healthData.summary.workingEndpoints}/{healthData.summary.totalEndpoints}
                </dd>
              </dl>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Response Time</dt>
                <dd className="text-lg font-medium text-gray-900">{healthData.duration}ms</dd>
              </dl>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex space-x-2">
                <button
                  onClick={fetchHealthData}
                  disabled={loading}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Refreshing...' : 'Refresh'}
                </button>
                <button
                  onClick={triggerRefresh}
                  className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  Force Update
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Environment Variables */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Environment Configuration</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(healthData.environment).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${typeof value === 'boolean' ? (value ? 'bg-green-500' : 'bg-red-500') : 'bg-blue-500'}`}></div>
                  <span className="text-sm text-gray-600">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                  {typeof value === 'string' && value !== 'not-configured' && (
                    <span className="text-xs text-gray-400 truncate max-w-32" title={value}>
                      {value}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* API Endpoints Status */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">API Endpoints Status</h3>
            <div className="space-y-4">
              {healthData.endpoints.map((endpoint, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${endpoint.ok ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="font-medium">{endpoint.endpoint}</span>
                      <span className={`text-sm ${getEndpointStatusColor(endpoint.ok)}`}>
                        HTTP {endpoint.status}
                      </span>
                    </div>
                  </div>
                  
                  {endpoint.error && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                      <p className="text-sm text-red-600">{endpoint.error}</p>
                    </div>
                  )}
                  
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-500">
                    {Object.entries(endpoint)
                      .filter(([key]) => !['endpoint', 'status', 'ok', 'error'].includes(key))
                      .map(([key, value]) => (
                        <div key={key}>
                          <span className="font-medium">{key}:</span> {String(value)}
                        </div>
                      ))
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {healthData.recommendations.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-yellow-800 mb-4">Recommendations</h3>
              <ul className="space-y-2">
                {healthData.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-yellow-600 mt-1">•</span>
                    <span className="text-sm text-yellow-700">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
