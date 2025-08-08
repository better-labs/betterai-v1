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

  const url = `${baseUrl}/api/cron/prediction-check`
  const options = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cronSecret}`,
      'Content-Type': 'application/json',
      'User-Agent': 'BetterAI-Cron/1.0',
    },
  }

  const body = JSON.stringify({
    daysLookback: Number(process.env.PREDICTION_CHECK_LOOKBACK_DAYS || 30),
    maxPredictions: Number(process.env.PREDICTION_CHECK_MAX || 200),
    includeClosedMarkets: process.env.PREDICTION_CHECK_INCLUDE_CLOSED === 'true',
    excludeCategories: (process.env.PREDICTION_CHECK_EXCLUDE_CATEGORIES || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  })

  if (dryRun) {
    console.log('🔍 DRY RUN - Would trigger prediction check')
    console.log(`📍 Endpoint: ${url}`)
    console.log(`📦 Body: ${body}`)
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
          console.log(`📝 Response:`, JSON.parse(data))
        } catch {
          console.log(`📝 Response:`, data)
        }
        if (res.statusCode >= 200 && res.statusCode < 300) resolve()
        else reject(new Error(`Status ${res.statusCode}`))
      })
    })
    req.on('error', (err) => reject(err))
    req.write(body)
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
