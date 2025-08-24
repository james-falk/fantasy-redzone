// Enhanced logging utility optimized for Vercel runtime logs
// Provides structured logging with different levels and detailed payloads

export interface LogContext {
  requestId?: string
  userId?: string
  operation?: string
  duration?: number
  timestamp?: string
  metadata?: Record<string, unknown>
  errorCode?: string
  [key: string]: unknown
}

class VercelLogger {
  private formatMessage(level: string, message: string, context?: LogContext, payload?: unknown): string {
    const timestamp = new Date().toISOString()
    const logData: Record<string, unknown> = {
      level,
      timestamp,
      message
    }
    
    if (context) {
      logData.context = context
    }
    
    if (payload && typeof payload === 'object' && payload !== null) {
      logData.payload = payload
    }
    
    // For Vercel logs, we want clean, readable output
    return JSON.stringify(logData, null, 2)
  }

  private log(level: string, message: string, context?: LogContext, payload?: unknown): void {
    const formattedMessage = this.formatMessage(level, message, context, payload)
    
    switch (level) {
      case 'ERROR':
        console.error(formattedMessage)
        break
      case 'WARN':
        console.warn(formattedMessage)
        break
      case 'INFO':
        console.info(formattedMessage)
        break
      case 'DEBUG':
        console.debug(formattedMessage)
        break
      default:
        console.log(formattedMessage)
    }
  }

  // Error logging with stack traces
  error(message: string, error?: Error, context?: LogContext): void {
    const errorContext = {
      ...context,
      errorName: error?.name,
      errorMessage: error?.message,
      errorStack: error?.stack,
    }
    this.log('ERROR', message, errorContext)
  }

  // Warning logs for degraded performance or non-critical issues
  warn(message: string, context?: LogContext, payload?: unknown): void {
    this.log('WARN', message, context, payload)
  }

  // Info logs for successful operations and important events
  info(message: string, context?: LogContext, payload?: unknown): void {
    this.log('INFO', message, context, payload)
  }

  // Debug logs for detailed troubleshooting (only in development)
  debug(message: string, context?: LogContext, payload?: unknown): void {
    if (process.env.NODE_ENV === 'development') {
      this.log('DEBUG', message, context, payload)
    }
  }

  // Special method for API endpoint success logs
  apiSuccess(endpoint: string, statusCode: number, context?: LogContext, responseData?: unknown): void {
    const message = `✅ API ${endpoint} completed successfully`
    
    const enhancedContext = {
      ...context,
      operation: 'api_call',
      endpoint,
      statusCode,
      success: true
    }

    this.info(message, enhancedContext, responseData)
  }

  // Special method for cron job success logs
  cronSuccess(jobName: string, results: unknown, context?: LogContext): void {
    const message = `✅ Cron job '${jobName}' completed successfully`
    
    const enhancedContext = {
      ...context,
      operation: 'cron_job',
      jobName,
      success: true
    }

    this.info(message, enhancedContext, results)
  }

  // Special method for OAuth token operations
  oauthTokenSuccess(operation: string, tokenStatus: string, context?: LogContext): void {
    const message = `✅ OAuth token ${operation} successful - Status: ${tokenStatus}`
    
    const enhancedContext = {
      ...context,
      operation: 'oauth_token',
      tokenOperation: operation,
      tokenStatus,
      success: true
    }

    this.info(message, enhancedContext)
  }

  // Method to create request context
  createRequestContext(requestId?: string, additionalContext?: Record<string, unknown>): LogContext {
    return {
      requestId: requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...additionalContext
    }
  }

  // Method to measure and log operation duration
  withTiming<T>(operation: () => Promise<T>, operationName: string, context?: LogContext): Promise<T> {
    const startTime = Date.now()
    
    return operation()
      .then(result => {
        const duration = Date.now() - startTime
        this.info(`⏱️ Operation '${operationName}' completed`, {
          ...context,
          operation: operationName,
          duration,
          success: true
        })
        return result
      })
      .catch(error => {
        const duration = Date.now() - startTime
        this.error(`❌ Operation '${operationName}' failed`, error, {
          ...context,
          operation: operationName,
          duration,
          success: false
        })
        throw error
      })
  }
}

// Export singleton instance
export const logger = new VercelLogger()
