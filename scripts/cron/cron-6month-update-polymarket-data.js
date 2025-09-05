#!/usr/bin/env node

/**
 * 6-Month Polymarket Data Update Cron Script
 * 
 * Standalone script for comprehensive 6-month market data updates
 * Completely separate from daily updates - focuses on long-term analysis
 * 
 * Usage:
 *   node scripts/cron/cron-6month-update-polymarket-data.js
 *   node scripts/cron/cron-6month-update-polymarket-data.js --dry-run
 * 
 * Environment Variables:
 *   All POLYMARKET_6MONTH_* variables from .env.example
 */

require('dotenv').config({ path: '.env.local' })

const https = require('https')
const http = require('http')

function normalizeBaseUrl(rawBaseUrl) {
  const fallback = 'http://localhost:3000'
  let baseUrl = (rawBaseUrl || '').trim() || fallback
  try {
    const parsed = new URL(baseUrl)
    const isLocalHost = ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname)
    if (isLocalHost && parsed.protocol === 'https:') {
      console.warn('⚠️  Detected https for localhost; switching to http:// to avoid TLS errors in local dev')
      parsed.protocol = 'http:'
      baseUrl = parsed.toString()
    } else {
      baseUrl = parsed.toString()
    }
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1)
  } catch {
    baseUrl = fallback
  }
  return baseUrl
}

async function run6MonthPolymarketUpdate(dryRun = false) {
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const baseUrl = normalizeBaseUrl(rawBaseUrl)
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error('❌ CRON_SECRET environment variable is not set')
    process.exit(1)
  }

  console.log('🔧 Using 6-MONTH COMPREHENSIVE configuration')
  
  // 6-Month specific configuration from environment variables
  const batchSize = Number(process.env.POLYMARKET_6MONTH_UPDATE_BATCH_SIZE ?? 50)
  const maxEvents = Number(process.env.POLYMARKET_6MONTH_MAX_EVENTS_LIMIT ?? 3000)
  const daysToFetchPast = Number(process.env.POLYMARKET_6MONTH_UPDATE_DAYS_PAST ?? 8)
  const daysToFetchFuture = Number(process.env.POLYMARKET_6MONTH_UPDATE_DAYS_FUTURE ?? 180)
  const delayMs = Number(process.env.POLYMARKET_6MONTH_UPDATE_DELAY_MS ?? 1000)
  const maxRetries = Number(process.env.POLYMARKET_6MONTH_UPDATE_MAX_RETRIES ?? 3)
  const retryDelayMs = Number(process.env.POLYMARKET_6MONTH_UPDATE_RETRY_DELAY_MS ?? 2000)
  const timeoutMs = Number(process.env.POLYMARKET_6MONTH_UPDATE_TIMEOUT_MS ?? 30000)
  const userAgent = encodeURIComponent(process.env.POLYMARKET_6MONTH_UPDATE_USER_AGENT || 'BetterAI-6Month/1.0')
  const sortBy = encodeURIComponent(process.env.POLYMARKET_6MONTH_UPDATE_SORT_BY || 'volume1yr')
  const maxBatchFailures = Number(process.env.POLYMARKET_6MONTH_UPDATE_MAX_BATCH_FAILURES ?? 3)

  // Build API URL with 6-month parameters
  const params = new URLSearchParams({
    batchSize: batchSize.toString(),
    maxEvents: maxEvents.toString(), 
    daysToFetchPast: daysToFetchPast.toString(),
    daysToFetchFuture: daysToFetchFuture.toString(),
    delayMs: delayMs.toString(),
    maxRetries: maxRetries.toString(),
    retryDelayMs: retryDelayMs.toString(),
    timeoutMs: timeoutMs.toString(),
    userAgent: userAgent,
    sortBy: sortBy,
    maxBatchFailuresBeforeAbort: maxBatchFailures.toString()
  })

  const url = `${baseUrl}/api/cron/6month-update-polymarket-data?${params.toString()}`
  const options = {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${cronSecret}`,
      'User-Agent': 'BetterAI-6Month-Cron/1.0',
    },
  }

  if (dryRun) {
    console.log('🔍 DRY RUN - Would trigger 6-month comprehensive Polymarket update')
    console.log(`📍 Endpoint: ${url}`)
    console.log('📊 Configuration:')
    console.log(`   - Batch Size: ${batchSize} events`)
    console.log(`   - Max Events: ${maxEvents} events`)
    console.log(`   - Date Range: ${daysToFetchPast} days past to ${daysToFetchFuture} days future`)
    console.log(`   - Delay: ${delayMs}ms between batches`)
    console.log(`   - Sort By: ${decodeURIComponent(sortBy)}`)
    console.log(`   - User Agent: ${decodeURIComponent(userAgent)}`)
    return
  }

  console.log('🔄 Triggering 6-month comprehensive Polymarket update...')
  console.log(`📍 Endpoint: ${url}`)
  console.log('📊 Configuration:')
  console.log(`   - Batch Size: ${batchSize} events`)
  console.log(`   - Max Events: ${maxEvents} events`) 
  console.log(`   - Date Range: ${daysToFetchPast} days past to ${daysToFetchFuture} days future`)
  console.log(`   - Delay: ${delayMs}ms between batches`)

  const startTime = Date.now()

  await new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http
    const req = protocol.request(url, options, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        const duration = Date.now() - startTime
        console.log(`⏱️  Duration: ${duration}ms`)
        console.log(`📊 Status: ${res.statusCode}`)
        try {
          const responseData = JSON.parse(data)
          console.log('📝 Response:', responseData)
          
          // Enhanced logging for 6-month updates
          if (responseData.insertedEvents) {
            console.log(`📈 Results: ${responseData.insertedEvents.length} events, ${responseData.insertedMarkets ? responseData.insertedMarkets.length : 0} markets`)
          }
        } catch {
          console.log('📝 Response:', data)
        }
        if (res.statusCode >= 200 && res.statusCode < 300) resolve()
        else reject(new Error(`Status ${res.statusCode}`))
      })
    })
    req.on('error', (err) => reject(err))
    req.end()
  })
}

if (require.main === module) {
  const dryRun = process.argv.includes('--dry-run')
  run6MonthPolymarketUpdate(dryRun)
    .then(() => {
      console.log('✅ 6-month Polymarket update completed successfully')
      process.exit(0)
    })
    .catch((err) => {
      console.error('💥 6-month Polymarket update failed:', err.message)
      process.exit(1)
    })
}

module.exports = { run6MonthPolymarketUpdate }