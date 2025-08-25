#!/usr/bin/env node

require('dotenv').config()

const https = require('https')
const http = require('http')

async function runPredictionCheck(dryRun = false) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error('❌ CRON_SECRET environment variable is not set')
    process.exit(1)
  }

  const daysLookback = Number(process.env.PREDICTION_CHECK_LOOKBACK_DAYS || 30)
  const maxPredictions = Number(process.env.PREDICTION_CHECK_MAX || 200)
  const includeClosedMarkets = (process.env.PREDICTION_CHECK_INCLUDE_CLOSED === 'true')
  const excludeCategories = (process.env.PREDICTION_CHECK_EXCLUDE_CATEGORIES || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const search = new URLSearchParams()
  search.set('daysLookback', String(daysLookback))
  search.set('maxPredictions', String(maxPredictions))
  search.set('includeClosedMarkets', includeClosedMarkets ? 'true' : 'false')
  for (const cat of excludeCategories) search.append('excludeCategories', cat)

  const url = `${baseUrl.replace(/\/$/, '')}/api/cron/prediction-check?${search.toString()}`
  const options = {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${cronSecret}`,
      'User-Agent': 'BetterAI-Cron/1.0',
    },
  }

  if (dryRun) {
    console.log('🔍 DRY RUN - Would trigger prediction check')
    console.log(`📍 Endpoint: ${url}`)
    return
  }

  console.log('🔄 Running prediction check...')
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
          const response = JSON.parse(data)
          console.log(`📝 Response:`, JSON.stringify(response, null, 2))
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
  runPredictionCheck(dryRun)
    .then(() => {
      console.log('✅ Prediction check completed')
      process.exit(0)
    })
    .catch((err) => {
      console.error('💥 Prediction check failed:', err.message)
      process.exit(1)
    })
}

module.exports = { runPredictionCheck }
