#!/usr/bin/env node

/**
 * Manual content refresh script
 * Run this to immediately refresh your YouTube videos and other content
 */

const https = require('https')
const http = require('http')

// You can update this to your deployed site URL once deployed
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const REFRESH_TOKEN = process.env.REFRESH_TOKEN || 'default-refresh-token'

console.log('🔄 Starting manual content refresh...')
console.log(`📍 Site URL: ${SITE_URL}`)

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
    console.log('🚀 Calling refresh endpoint...')
    
    const response = await makeRequest(`${SITE_URL}/api/refresh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REFRESH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })

    console.log(`📊 Response Status: ${response.status}`)

    if (response.status === 200 && response.data.success) {
      console.log('✅ Content refresh successful!')
      console.log(`📊 Results: ${response.data.results.successful} successful, ${response.data.results.failed} failed`)
      console.log(`⏰ Completed at: ${response.data.results.timestamp}`)
      
      console.log('\n🎯 What was refreshed:')
      console.log('  • YouTube Subscriptions (last 3 days)')
      console.log('  • YouTube General Search')
      console.log('  • YouTube News Search') 
      console.log('  • YouTube Rankings Search')
      console.log('  • RSS Feeds')
      console.log('  • News Articles (if configured)')
      
      console.log('\n✨ Your site now has fresh content!')
      
    } else {
      console.log('❌ Content refresh failed')
      console.log('Response:', response.data)
      
      if (response.status === 401) {
        console.log('\n💡 This might be because:')
        console.log('  • The dev server isn\'t running (try: npm run dev)')
        console.log('  • Wrong refresh token')
        console.log('  • Site not deployed yet')
      }
    }
  } catch (error) {
    console.log('❌ Error during refresh:', error.message)
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 The development server isn\'t running.')
      console.log('Either:')
      console.log('  1. Run "npm run dev" first, then run this script again')
      console.log('  2. Or deploy your site and update SITE_URL to your deployed URL')
    }
  }
}

console.log('⚡ Manual Refresh Script')
console.log('This will refresh your YouTube videos and other content right now.')
console.log('')

refreshContent()
