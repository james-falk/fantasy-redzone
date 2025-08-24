/**
 * Environment Configuration Utility
 * 
 * This module provides centralized environment variable handling with
 * proper validation, type safety, and environment-specific behavior.
 * 
 * ENVIRONMENT UNIFICATION:
 * - Local Development: Reads from .env.local
 * - Production: Reads from Vercel environment variables
 * - Consistent validation and error handling across environments
 * - Type-safe environment variable access
 */

export interface EnvironmentConfig {
  // Site Configuration
  siteUrl: string
  siteName: string
  siteDescription: string
  
  // Authentication
  nextAuthUrl: string
  nextAuthSecret: string
  googleClientId?: string
  googleClientSecret?: string
  
  // Database
  mongodbUri: string
  
  // External APIs
  youtubeApiKey: string
  
  // Feature Flags
  enableAiChat: boolean
  enableTeamInsights: boolean
  enableNameGenerator: boolean
  
  // Deployment & Automation
  cronSecret?: string
  refreshToken?: string
  
  // Environment Detection
  isDevelopment: boolean
  isProduction: boolean
  isVercel: boolean
}

/**
 * Validates that required environment variables are present
 * @param environment - The environment configuration object
 * @throws Error if required variables are missing
 */
function validateEnvironment(environment: EnvironmentConfig): void {
  const requiredFields: Array<keyof EnvironmentConfig> = [
    'siteUrl',
    'siteName', 
    'siteDescription',
    'nextAuthUrl',
    'nextAuthSecret',
    'mongodbUri',
    'youtubeApiKey'
  ]

  const missingFields = requiredFields.filter(field => !environment[field])
  
  if (missingFields.length > 0) {
    const environmentType = environment.isProduction ? 'production' : 'development'
    throw new Error(
      `Missing required environment variables for ${environmentType}: ${missingFields.join(', ')}`
    )
  }
}

/**
 * Gets the current environment configuration
 * @returns EnvironmentConfig - Validated environment configuration
 * @throws Error if required environment variables are missing
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isProduction = process.env.NODE_ENV === 'production'
  const isVercel = !!process.env.VERCEL_ENV

  const config: EnvironmentConfig = {
    // Site Configuration
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || '',
    siteName: process.env.NEXT_PUBLIC_SITE_NAME || 'Fantasy Red Zone',
    siteDescription: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || 'Your ultimate destination for fantasy football content',
    
    // Authentication
    nextAuthUrl: process.env.NEXTAUTH_URL || '',
    nextAuthSecret: process.env.NEXTAUTH_SECRET || '',
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    
    // Database
    mongodbUri: process.env.MONGODB_URI || '',
    
    // External APIs
    youtubeApiKey: process.env.YOUTUBE_API_KEY || '',
    
    // Feature Flags
    enableAiChat: process.env.ENABLE_AI_CHAT === 'true',
    enableTeamInsights: process.env.ENABLE_TEAM_INSIGHTS === 'true',
    enableNameGenerator: process.env.ENABLE_NAME_GENERATOR === 'true',
    
    // Deployment & Automation
    cronSecret: process.env.CRON_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
    
    // Environment Detection
    isDevelopment,
    isProduction,
    isVercel
  }

  // Validate configuration
  validateEnvironment(config)
  
  return config
}

/**
 * Gets a specific environment variable with type safety
 * @param key - The environment variable key
 * @param defaultValue - Optional default value
 * @returns The environment variable value or default
 */
export function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key]
  
  if (!value && defaultValue === undefined) {
    const environment = process.env.NODE_ENV || 'development'
    throw new Error(`Environment variable ${key} is required but not set in ${environment}`)
  }
  
  return value || defaultValue || ''
}

/**
 * Gets a boolean environment variable
 * @param key - The environment variable key
 * @param defaultValue - Default value if not set
 * @returns Boolean value
 */
export function getBooleanEnvVar(key: string, defaultValue: boolean = false): boolean {
  const value = process.env[key]
  return value === 'true' ? true : value === 'false' ? false : defaultValue
}

/**
 * Logs environment configuration for debugging (without sensitive data)
 */
export function logEnvironmentInfo(): void {
  const config = getEnvironmentConfig()
  
  console.log('🌍 [ENVIRONMENT] Configuration loaded:', {
    environment: config.isProduction ? 'production' : 'development',
    isVercel: config.isVercel,
    siteUrl: config.siteUrl,
    siteName: config.siteName,
    hasMongoDbUri: !!config.mongodbUri,
    hasYouTubeApiKey: !!config.youtubeApiKey,
    hasNextAuthSecret: !!config.nextAuthSecret,
    featureFlags: {
      aiChat: config.enableAiChat,
      teamInsights: config.enableTeamInsights,
      nameGenerator: config.enableNameGenerator
    }
  })
}
