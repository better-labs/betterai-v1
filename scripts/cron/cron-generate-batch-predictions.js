#!/usr/bin/env node

require('dotenv').config()

const https = require('https')
const http = require('http')

async function runBatchPredictions(dryRun = false) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error('❌ CRON_SECRET environment variable is not set')
    process.exit(1)
  }

  const topMarketsCount = Number(process.env.BATCH_PREDICTIONS_TOP_COUNT || 20)
  const endDateRangeHours = Number(process.env.BATCH_PREDICTIONS_END_RANGE_HOURS || 24)
  const targetDaysFromNow = Number(process.env.BATCH_PREDICTIONS_TARGET_DAYS || 7)
  const modelName = encodeURIComponent(process.env.BATCH_PREDICTIONS_MODEL || 'google/gemini-2.5-flash-lite')

  const url = `${baseUrl}/api/cron/generate-batch-predictions?topMarketsCount=${topMarketsCount}&endDateRangeHours=${endDateRangeHours}&targetDaysFromNow=${targetDaysFromNow}&modelName=${modelName}`
  const options = {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${cronSecret}`,
      'User-Agent': 'BetterAI-Cron/1.0',
    },
  }

  if (dryRun) {
    console.log('🔍 DRY RUN - Would trigger batch predictions')
    console.log(`📍 Endpoint: ${url}`)
    return
  }

  console.log('🔄 Triggering batch predictions...')
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
