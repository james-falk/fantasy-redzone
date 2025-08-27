#!/usr/bin/env node

/**
 * Fantasy Red Zone - Content Monitoring Script
 * 
 * This script monitors your content freshness and provides actionable recommendations
 * to ensure your site never falls behind on content updates again.
 * 
 * Usage:
 *   node monitor-content.js
 *   node monitor-content.js --refresh  # Also run a refresh if needed
 */

const https = require('https')
const http = require('http')

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const REFRESH_TOKEN = process.env.REFRESH_TOKEN || 'local-dev-refresh-token'

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const isHttps = urlObj.protocol === 'https:'
    const client = isHttps ? https : http
    
    const req = client.request(url, options, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data)
          resolve({
            status: res.statusCode,
            data: jsonData
          })
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: { error: 'Invalid JSON response', rawData: data }
          })
        }
      })
    })
    
    req.on('error', (error) => {
      reject(error)
    })
    
    if (options.body) {
      req.write(options.body)
    }
    req.end()
  })
}

async function runMonitoring() {
  console.log('🔍 FANTASY RED ZONE - CONTENT MONITORING')
  console.log('=' .repeat(80))
  console.log(`📍 Site URL: ${SITE_URL}`)
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`)
  console.log('')

  try {
    // Step 1: Health Check
    console.log('🏥 STEP 1: COMPREHENSIVE HEALTH CHECK')
    console.log('-'.repeat(40))
    
    const healthResponse = await makeRequest(`${SITE_URL}/api/health`)
    
    if (healthResponse.status !== 200) {
      console.log('❌ Health check failed - site may be down')
      return
    }
    
    const health = healthResponse.data
    console.log(`📊 Overall Status: ${health.status.toUpperCase()}`)
    console.log(`💬 Message: ${health.message}`)
    console.log('')
    
    // Display health check results
    Object.entries(health.checks).forEach(([checkName, check]) => {
      const status = check.status === 'healthy' ? '✅' : check.status === 'warning' ? '⚠️' : '❌'
      console.log(`${status} ${checkName.toUpperCase()}: ${check.message}`)
      
      if (check.details) {
        Object.entries(check.details).forEach(([key, value]) => {
          console.log(`   ${key}: ${value}`)
        })
      }
    })
    
    console.log('')
    
    // Display recommendations
    if (health.recommendations && health.recommendations.length > 0) {
      console.log('💡 RECOMMENDATIONS:')
      health.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`)
      })
      console.log('')
    }

    // Step 2: Content Analysis
    console.log('📊 STEP 2: CONTENT ANALYSIS')
    console.log('-'.repeat(40))
    
    const resourcesResponse = await makeRequest(`${SITE_URL}/api/resources?limit=100`)
    
    if (resourcesResponse.status === 200) {
      const resources = resourcesResponse.data.data || []
      
      const youtubeContent = resources.filter(r => r.source === 'YouTube')
      const rssContent = resources.filter(r => r.source === 'RSS')
      const recentContent = resources.filter(r => {
        const pubDate = new Date(r.publishDate || r.createdAt)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        return pubDate > oneDayAgo
      })
      
      console.log(`📺 YouTube Content: ${youtubeContent.length}`)
      console.log(`📰 RSS Content: ${rssContent.length}`)
      console.log(`🆕 Content from last 24h: ${recentContent.length}`)
      console.log(`📁 Total Content: ${resources.length}`)
      
      if (resources.length > 0) {
        console.log('')
        console.log('📅 RECENT CONTENT (Last 5 items):')
        resources.slice(0, 5).forEach((item, index) => {
          const pubDate = new Date(item.publishDate || item.createdAt).toLocaleString()
          console.log(`   ${index + 1}. ${item.title}`)
          console.log(`      Source: ${item.source} | Date: ${pubDate}`)
        })
      }
    }
    
    console.log('')

    // Step 3: Feed Sources Status
    console.log('📋 STEP 3: FEED SOURCES STATUS')
    console.log('-'.repeat(40))
    
    const feedSourcesResponse = await makeRequest(`${SITE_URL}/api/feedsources`)
    
    if (feedSourcesResponse.status === 200) {
      const sources = feedSourcesResponse.data.data || []
      
      const enabledSources = sources.filter(s => s.enabled)
      const errorSources = sources.filter(s => s.errorCount > 0)
      const youtubeSources = sources.filter(s => s.type === 'youtube')
      const rssSources = sources.filter(s => s.type === 'rss')
      
      console.log(`✅ Enabled Sources: ${enabledSources.length}`)
      console.log(`❌ Sources with Errors: ${errorSources.length}`)
      console.log(`📺 YouTube Sources: ${youtubeSources.length}`)
      console.log(`📰 RSS Sources: ${rssSources.length}`)
      
      if (errorSources.length > 0) {
        console.log('')
        console.log('🚨 SOURCES WITH ERRORS:')
        errorSources.forEach(source => {
          console.log(`   ❌ ${source.name}: ${source.lastError}`)
        })
      }
    }
    
    console.log('')

    // Step 4: Action Plan
    console.log('🎯 STEP 4: ACTION PLAN')
    console.log('-'.repeat(40))
    
    const needsRefresh = health.status === 'critical' || health.status === 'warning'
    const hasErrors = health.checks.scheduler.status === 'critical' || 
                     health.checks.content.status === 'critical'
    
    if (needsRefresh) {
      console.log('🔄 CONTENT REFRESH NEEDED')
      console.log('   Running comprehensive refresh...')
      
      try {
        const refreshResponse = await makeRequest(`${SITE_URL}/api/refresh`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${REFRESH_TOKEN}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (refreshResponse.status === 200) {
          console.log('✅ Refresh completed successfully!')
          
          if (refreshResponse.data.result) {
            if (refreshResponse.data.result.youtube) {
              console.log(`   📺 YouTube: ${refreshResponse.data.result.youtube.newVideos || 0} new videos`)
            }
            if (refreshResponse.data.result.rss) {
              console.log(`   📰 RSS: ${refreshResponse.data.result.rss.newArticles || 0} new articles`)
            }
          }
        } else {
          console.log('❌ Refresh failed:', refreshResponse.data.message)
        }
      } catch (error) {
        console.log('❌ Refresh failed:', error.message)
      }
    } else {
      console.log('✅ Content is fresh - no refresh needed')
    }
    
    if (hasErrors) {
      console.log('')
      console.log('🔧 ERROR RESOLUTION NEEDED:')
      console.log('   1. Check server logs for detailed error information')
      console.log('   2. Verify feed source configurations')
      console.log('   3. Check database connectivity')
      console.log('   4. Verify environment variables')
    }
    
    console.log('')
    console.log('📅 NEXT SCHEDULED REFRESH:')
    console.log('   • Daily at 6:00 AM EST (11:00 UTC)')
    console.log('   • Manual refresh available via: node refresh-now.js')
    console.log('   • Health monitoring available via: node monitor-content.js')
    
    console.log('')
    console.log('✅ MONITORING COMPLETE')
    console.log('=' .repeat(80))
    
  } catch (error) {
    console.error('❌ Monitoring failed:', error.message)
    console.log('')
    console.log('🔧 TROUBLESHOOTING:')
    console.log('   1. Check if the site is running: npm run dev')
    console.log('   2. Verify the site URL is correct')
    console.log('   3. Check network connectivity')
    console.log('   4. Review server logs for errors')
  }
}

// Check if --refresh flag is provided
const shouldRefresh = process.argv.includes('--refresh')

if (shouldRefresh) {
  console.log('🔄 Refresh mode enabled - will run refresh if needed')
  console.log('')
}

runMonitoring()
