#!/usr/bin/env node

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

async function runBatchPredictions(dryRun = false) {
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const baseUrl = normalizeBaseUrl(rawBaseUrl)
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error('❌ CRON_SECRET environment variable is not set')
    process.exit(1)
  }

  // Determine config type: Check if --6month flag is passed or USE_6MONTH_CONFIG env var is set
  const use6MonthConfig = process.argv.includes('--6month') || process.env.USE_6MONTH_CONFIG === 'true'
  const configPrefix = use6MonthConfig ? 'BATCH_PREDICTIONS_6MONTH_' : 'BATCH_PREDICTIONS_'
  
  console.log(`🔧 Using ${use6MonthConfig ? '6-MONTH' : 'STANDARD'} batch prediction configuration`)
  
  const topMarketsCount = Number(process.env[`${configPrefix}TOP_COUNT`] || (use6MonthConfig ? 100 : 10))
  const endDateRangeHours = Number(process.env[`${configPrefix}END_RANGE_HOURS`] || (use6MonthConfig ? 4320 : 24))
  const targetDaysFromNow = Number(process.env[`${configPrefix}TARGET_DAYS`] || (use6MonthConfig ? 180 : 7))
  const modelName = encodeURIComponent(process.env[`${configPrefix}MODEL`] || (use6MonthConfig ? 'google/gemini-2.0-flash-001' : 'google/gemini-2.5-flash-lite'))
  const concurrencyParam = Number(process.env[`${configPrefix}CONCURRENCY`] || 3)

  const url = `${baseUrl.replace(/\/$/, '')}/api/cron/daily-generate-batch-predictions?topMarketsCount=${topMarketsCount}&endDateRangeHours=${endDateRangeHours}&targetDaysFromNow=${targetDaysFromNow}&modelName=${modelName}&concurrencyPerModel=${concurrencyParam}`
  const options = {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${cronSecret}`,
      'User-Agent': 'BetterAI-Cron/1.0',
    },
  }

  if (dryRun) {
    console.log(`🔍 DRY RUN - Would trigger ${use6MonthConfig ? '6-MONTH' : 'standard'} batch predictions`)
    console.log(`📍 Endpoint: ${url}`)
    return
  }

  console.log(`🔄 Triggering ${use6MonthConfig ? '6-MONTH' : 'standard'} batch predictions...`)
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
  runBatchPredictions(dryRun)
    .then(() => {
      console.log('✅ Batch predictions triggered')
      process.exit(0)
    })
    .catch((err) => {
      console.error('💥 Batch predictions failed:', err.message)
      process.exit(1)
    })
}

module.exports = { runBatchPredictions }


