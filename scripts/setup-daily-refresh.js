#!/usr/bin/env node

/**
 * Script to set up daily refresh of YouTube subscription content
 * This can be run manually or scheduled to run daily
 */

const https = require('https')
const http = require('http')

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const REFRESH_TOKEN = process.env.REFRESH_TOKEN || 'fantasy-red-zone-refresh-2024'

console.log('🚀 Starting daily content refresh...')
console.log(`📍 Site URL: ${SITE_URL}`)

// Function to make HTTP request
function makeRequest(url, options) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http
    const req = lib.request(url, options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data)
          resolve({ status: res.statusCode, data: jsonData })
        } catch (e) {
          resolve({ status: res.statusCode, data: data })
        }
      })
    })
    
    req.on('error', reject)
    if (options.body) {
      req.write(options.body)
    }
    req.end()
  })
}

async function refreshContent() {
  try {
    const response = await makeRequest(`${SITE_URL}/api/refresh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REFRESH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.status === 200 && response.data.success) {
      console.log('✅ Content refresh successful!')
      console.log(`📊 Results: ${response.data.results.successful} successful, ${response.data.results.failed} failed`)
      console.log(`⏰ Completed at: ${response.data.results.timestamp}`)
    } else {
      console.error('❌ Content refresh failed:', response.data.error || 'Unknown error')
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Error during refresh:', error.message)
    process.exit(1)
  }
}

// Run the refresh
refreshContent()