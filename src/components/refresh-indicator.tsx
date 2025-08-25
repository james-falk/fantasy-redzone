'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'

interface RefreshCheckResponse {
  newDataAvailable: boolean
  lastCheckTime: string
  currentTime: string
  resourceCount: number
  youtubeVideosCount: number
  lastResourceTime: string | null
  timeSinceLastResource: number | null
  lastIngestionTime: string | null
  nextScheduledIngestion: string | null
  schedulerStatus: 'success' | 'failed' | 'pending' | 'unknown'
  sources: {
    youtube: {
      count: number
      lastUpdate: string | null
    }
    articles: {
      count: number
      lastUpdate: string | null
    }
  }
}

interface RefreshIndicatorProps {
  onRefresh?: () => void
  pollingInterval?: number // in milliseconds, default 2 minutes
  showStatus?: boolean
  className?: string
}

export default function RefreshIndicator({
  onRefresh,
  pollingInterval = 30 * 60 * 1000, // 30 minutes default
  showStatus = false,
  className = ''
}: RefreshIndicatorProps) {
  const [lastCheckTime, setLastCheckTime] = useState<Date>(new Date())
  const [isChecking, setIsChecking] = useState(false)
  const [lastResponse, setLastResponse] = useState<RefreshCheckResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showNewContentAlert, setShowNewContentAlert] = useState(false)
  
  // Use ref to track the latest check time without causing re-renders
  const lastCheckTimeRef = useRef<Date>(new Date())
  
  // Use ref to store the latest performRefreshCheck function
  const performRefreshCheckRef = useRef<() => Promise<RefreshCheckResponse | null> | undefined>(undefined)

  /**
   * Performs a refresh check by calling the API
   */
  const performRefreshCheck = useCallback(async (): Promise<RefreshCheckResponse | null> => {
    try {
      setIsChecking(true)
      setError(null)
      
      console.log('🔄 [FRONTEND] Performing refresh check...')
      
      const response = await fetch(`/api/refresh-check?lastCheck=${lastCheckTimeRef.current.toISOString()}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data: RefreshCheckResponse = await response.json()
      setLastResponse(data)
      
      // Update both state and ref
      const newCheckTime = new Date()
      setLastCheckTime(newCheckTime)
      lastCheckTimeRef.current = newCheckTime
      
             console.log('✅ [FRONTEND] Refresh check completed:', {
         newDataAvailable: data.newDataAvailable,
         resourceCount: data.resourceCount,
         youtubeVideosCount: data.youtubeVideosCount,
         schedulerStatus: data.schedulerStatus,
         lastIngestion: data.lastIngestionTime,
         nextScheduled: data.nextScheduledIngestion
       })
      
      // Show alert if new content is available
      if (data.newDataAvailable) {
        setShowNewContentAlert(true)
        console.log('🎉 [FRONTEND] New content detected!')
        
        // Auto-hide alert after 10 seconds
        setTimeout(() => {
          setShowNewContentAlert(false)
        }, 10000)
      }
      
      return data
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      console.error('❌ [FRONTEND] Refresh check failed:', errorMsg)
      setError(errorMsg)
      return null
         } finally {
       setIsChecking(false)
     }
   }, []) // Remove lastCheckTime dependency
   
   // Store the latest function in ref
   performRefreshCheckRef.current = performRefreshCheck

  /**
   * Triggers a manual refresh
   */
  const handleManualRefresh = useCallback(async () => {
    console.log('🔄 [FRONTEND] Manual refresh triggered')
    
    if (performRefreshCheckRef.current) {
      const result = await performRefreshCheckRef.current()
      
      if (result?.newDataAvailable && onRefresh) {
        console.log('🔄 [FRONTEND] Calling onRefresh callback...')
        onRefresh()
      }
    }
  }, [onRefresh]) // Remove performRefreshCheck dependency

  /**
   * Formats time since last resource
   */
  const formatTimeSince = (minutes: number | null): string => {
    if (minutes === null) return 'Unknown'
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  /**
   * Formats the last check time
   */
  const formatLastCheck = (date: Date): string => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  // Set up polling interval
  useEffect(() => {
    console.log('🔄 [FRONTEND] Setting up refresh polling every', pollingInterval, 'ms')
    
    // Perform initial check
    if (performRefreshCheckRef.current) {
      performRefreshCheckRef.current()
    }
    
    // Set up interval
    const interval = setInterval(() => {
      if (performRefreshCheckRef.current) {
        performRefreshCheckRef.current()
      }
    }, pollingInterval)
    
    // Cleanup on unmount
    return () => {
      console.log('🔄 [FRONTEND] Cleaning up refresh polling')
      clearInterval(interval)
    }
  }, [pollingInterval]) // Only depend on pollingInterval

  return (
    <div className={`refresh-indicator ${className}`}>
      {/* New Content Alert */}
      {showNewContentAlert && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-right duration-300">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">New content available!</span>
          <button
            onClick={() => setShowNewContentAlert(false)}
            className="ml-2 text-white/80 hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      {/* Status Display */}
      {showStatus && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {/* Status Icon */}
          {isChecking ? (
            <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
          ) : error ? (
            <AlertCircle className="w-4 h-4 text-red-500" />
          ) : lastResponse?.newDataAvailable ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <div className="w-4 h-4 rounded-full bg-gray-300" />
          )}

          {/* Status Text */}
          <span>
            {isChecking ? 'Checking for updates...' : 
             error ? 'Check failed' :
             lastResponse?.newDataAvailable ? 'New content available' :
             'Up to date'}
          </span>

          {/* Last Check Time */}
          {!isChecking && (
            <span className="text-gray-400">
              • Last check: {formatLastCheck(lastCheckTime)}
            </span>
          )}

          {/* Manual Refresh Button */}
          <button
            onClick={handleManualRefresh}
            disabled={isChecking}
            className="ml-2 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      )}

       
    </div>
  )
}
