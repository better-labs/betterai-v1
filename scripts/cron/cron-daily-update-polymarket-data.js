#!/usr/bin/env node

require('dotenv').config()

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

async function runDailyPolymarketUpdate(dryRun = false) {
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const baseUrl = normalizeBaseUrl(rawBaseUrl)
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error('❌ CRON_SECRET environment variable is not set')
    process.exit(1)
  }

  const params = new URLSearchParams()
  // Allow ENV overrides for window and throttling
  if (process.env.POLYMARKET_UPDATE_LIMIT) params.set('limit', String(process.env.POLYMARKET_UPDATE_LIMIT))
  if (process.env.POLYMARKET_UPDATE_DELAY_MS) params.set('delayMs', String(process.env.POLYMARKET_UPDATE_DELAY_MS))
  if (process.env.POLYMARKET_UPDATE_DAYS_PAST) params.set('daysToFetchPast', String(process.env.POLYMARKET_UPDATE_DAYS_PAST))
  if (process.env.POLYMARKET_UPDATE_DAYS_FUTURE) params.set('daysToFetchFuture', String(process.env.POLYMARKET_UPDATE_DAYS_FUTURE))
  if (process.env.POLYMARKET_UPDATE_MAX_RETRIES) params.set('maxRetries', String(process.env.POLYMARKET_UPDATE_MAX_RETRIES))
  if (process.env.POLYMARKET_UPDATE_RETRY_DELAY_MS) params.set('retryDelayMs', String(process.env.POLYMARKET_UPDATE_RETRY_DELAY_MS))
  if (process.env.POLYMARKET_UPDATE_TIMEOUT_MS) params.set('timeoutMs', String(process.env.POLYMARKET_UPDATE_TIMEOUT_MS))
  if (process.env.POLYMARKET_UPDATE_USER_AGENT) params.set('userAgent', String(process.env.POLYMARKET_UPDATE_USER_AGENT))

  const qs = params.toString()
  const url = `${baseUrl}/api/cron/daily-update-polymarket-data${qs ? `?${qs}` : ''}`
  const options = {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${cronSecret}`,
      'User-Agent': 'BetterAI-Cron/1.0',
    },
  }

  if (dryRun) {
    console.log('🔍 DRY RUN - Would trigger daily Polymarket update')
    console.log(`📍 Endpoint: ${url}`)
    return
  }

  console.log('🔄 Triggering daily Polymarket update...')
  console.log(`📍 Endpoint: ${url}`)

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
          console.log(`📝 Response:`, JSON.parse(data))
        } catch {
          console.log(`📝 Response:`, data)
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
  runDailyPolymarketUpdate(dryRun)
    .then(() => {
      console.log('✅ Daily Polymarket update completed')
      process.exit(0)
    })
    .catch((err) => {
      console.error('💥 Daily Polymarket update failed:', err.message)
      process.exit(1)
    })
}

module.exports = { runDailyPolymarketUpdate }


