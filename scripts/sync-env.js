#!/usr/bin/env node

/**
 * Environment Synchronization Script
 * 
 * This script helps maintain consistency between local development
 * and production environment variables.
 * 
 * Usage:
 *   node scripts/sync-env.js check     # Check for missing variables
 *   node scripts/sync-env.js validate  # Validate current configuration
 *   node scripts/sync-env.js template  # Generate template from current .env.local
 */

const fs = require('fs')
const path = require('path')

// Environment variable categories
const REQUIRED_VARS = {
  'Site Configuration': [
    'NEXT_PUBLIC_SITE_URL',
    'NEXT_PUBLIC_SITE_NAME',
    'NEXT_PUBLIC_SITE_DESCRIPTION'
  ],
  'Authentication': [
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET'
  ],
  'Database': [
    'MONGODB_URI'
  ],
  'External APIs': [
    'YOUTUBE_API_KEY'
  ]
}

const OPTIONAL_VARS = {
  'OAuth Providers': [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET'
  ],
  'Feature Flags': [
    'ENABLE_AI_CHAT',
    'ENABLE_TEAM_INSIGHTS',
    'ENABLE_NAME_GENERATOR'
  ],
  'Deployment & Automation': [
    'CRON_SECRET',
    'REFRESH_TOKEN'
  ]
}

/**
 * Parse environment file
 */
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {}
  }

  const content = fs.readFileSync(filePath, 'utf8')
  const vars = {}

  content.split('\n').forEach(line => {
    line = line.trim()
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        vars[key.trim()] = valueParts.join('=').trim()
      }
    }
  })

  return vars
}

/**
 * Check for missing required environment variables
 */
function checkMissingVars() {
  console.log('🔍 Checking environment variables...\n')

  const localVars = parseEnvFile('.env.local')
  const exampleVars = parseEnvFile('env.example')
  
  let hasIssues = false

  // Check required variables
  Object.entries(REQUIRED_VARS).forEach(([category, vars]) => {
    console.log(`📋 ${category}:`)
    
    vars.forEach(varName => {
      const hasLocal = localVars.hasOwnProperty(varName)
      const hasExample = exampleVars.hasOwnProperty(varName)
      
      if (!hasLocal) {
        console.log(`  ❌ ${varName} - Missing in .env.local`)
        hasIssues = true
      } else if (!hasExample) {
        console.log(`  ⚠️  ${varName} - Missing in env.example`)
        hasIssues = true
      } else {
        console.log(`  ✅ ${varName}`)
      }
    })
    console.log('')
  })

  // Check optional variables
  console.log('📋 Optional Variables:')
  Object.entries(OPTIONAL_VARS).forEach(([category, vars]) => {
    vars.forEach(varName => {
      const hasLocal = localVars.hasOwnProperty(varName)
      const hasExample = exampleVars.hasOwnProperty(varName)
      
      if (hasLocal && !hasExample) {
        console.log(`  ⚠️  ${varName} - In .env.local but not in env.example`)
        hasIssues = true
      } else if (!hasLocal && hasExample) {
        console.log(`  ℹ️  ${varName} - Optional, not set locally`)
      } else if (hasLocal && hasExample) {
        console.log(`  ✅ ${varName}`)
      }
    })
  })

  if (!hasIssues) {
    console.log('\n✅ All environment variables are properly configured!')
  } else {
    console.log('\n⚠️  Some environment variables need attention.')
    console.log('Run "node scripts/sync-env.js validate" for detailed validation.')
  }

  return !hasIssues
}

/**
 * Validate current environment configuration
 */
function validateConfig() {
  console.log('🔍 Validating environment configuration...\n')

  const localVars = parseEnvFile('.env.local')
  
  // Validate required variables
  Object.entries(REQUIRED_VARS).forEach(([category, vars]) => {
    console.log(`📋 ${category}:`)
    
    vars.forEach(varName => {
      const value = localVars[varName]
      
      if (!value) {
        console.log(`  ❌ ${varName} - Not set`)
      } else if (value === 'your-value-here' || value.includes('your-')) {
        console.log(`  ⚠️  ${varName} - Contains placeholder value`)
      } else {
        console.log(`  ✅ ${varName} - Configured`)
      }
    })
    console.log('')
  })

  // Check for common issues
  console.log('🔍 Common Issues:')
  
  if (localVars.NEXT_PUBLIC_SITE_URL === 'https://your-site.vercel.app') {
    console.log('  ⚠️  NEXT_PUBLIC_SITE_URL should be set to your actual site URL')
  }
  
  if (localVars.NEXTAUTH_URL === 'https://your-site.vercel.app') {
    console.log('  ⚠️  NEXTAUTH_URL should be set to your actual site URL')
  }
  
  if (localVars.MONGODB_URI && localVars.MONGODB_URI.includes('username:password')) {
    console.log('  ⚠️  MONGODB_URI contains placeholder credentials')
  }
  
  if (localVars.YOUTUBE_API_KEY && localVars.YOUTUBE_API_KEY === 'your-youtube-api-key-here') {
    console.log('  ⚠️  YOUTUBE_API_KEY should be set to your actual API key')
  }

  console.log('\n✅ Validation complete!')
}

/**
 * Generate template from current .env.local
 */
function generateTemplate() {
  console.log('📝 Generating environment template...\n')

  const localVars = parseEnvFile('.env.local')
  const exampleVars = parseEnvFile('env.example')
  
  // Create template content
  let template = `# =============================================================================
# FANTASY RED ZONE - ENVIRONMENT CONFIGURATION
# =============================================================================
# 
# This file serves as a template for environment variables.
# Copy this file to .env.local for local development.
# 
# IMPORTANT: In production (Vercel), these values are set via environment
# variables in the Vercel dashboard, NOT from this file.
# =============================================================================

`

  // Add all variables from .env.local with placeholder values
  Object.keys(localVars).forEach(varName => {
    const value = localVars[varName]
    
    // Determine if this is a sensitive variable
    const isSensitive = varName.includes('SECRET') || 
                       varName.includes('KEY') || 
                       varName.includes('PASSWORD') ||
                       varName.includes('TOKEN') ||
                       varName.includes('MONGODB_URI')
    
    // Create placeholder value
    let placeholder
    if (isSensitive) {
      placeholder = `your-${varName.toLowerCase().replace(/_/g, '-')}-here`
    } else if (varName.includes('URL')) {
      placeholder = 'https://your-site.vercel.app'
    } else if (varName.includes('ENABLE_')) {
      placeholder = 'false'
    } else {
      placeholder = `your-${varName.toLowerCase().replace(/_/g, '-')}-here`
    }
    
    template += `${varName}=${placeholder}\n`
  })

  // Write template
  fs.writeFileSync('env.example', template)
  console.log('✅ Generated env.example template')
  console.log(`📊 Included ${Object.keys(localVars).length} environment variables`)
}

/**
 * Main function
 */
function main() {
  const command = process.argv[2]

  switch (command) {
    case 'check':
      checkMissingVars()
      break
    case 'validate':
      validateConfig()
      break
    case 'template':
      generateTemplate()
      break
    default:
      console.log('Environment Synchronization Script\n')
      console.log('Usage:')
      console.log('  node scripts/sync-env.js check     # Check for missing variables')
      console.log('  node scripts/sync-env.js validate  # Validate current configuration')
      console.log('  node scripts/sync-env.js template  # Generate template from current .env.local')
      console.log('\nFor more information, see ENVIRONMENT_SETUP.md')
  }
}

// Run the script
if (require.main === module) {
  main()
}
