// Load environment variables FIRST, before any other imports
import { config } from 'dotenv'
import { resolve } from 'path'

// Try .env.local first, then fall back to .env
config({ path: resolve(process.cwd(), '.env.local') })

// Verify DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required')
  console.error('Please ensure .env.local exists and contains DATABASE_URL')
  process.exit(1)
}

// Verify API keys are loaded
if (!process.env.OPENROUTER_API_KEY) {
  console.warn('⚠️  OPENROUTER_API_KEY not found - Grok tests will be skipped')
}
if (!process.env.EXA_API_KEY) {
  console.warn('⚠️  EXA_API_KEY not found - Exa.ai tests will be skipped')
}

// Now import everything else after env vars are loaded
import { prisma } from '@/lib/db/prisma'
import { 
  performMarketResearchV2,
  performExaResearch,
  performGrokResearch
} from '@/lib/services/research/research-service-v2'
import { validateResearchSourceEnvironment } from '@/lib/config/research-sources'

async function getTestMarkets() {
  // Specific market IDs to test
  const specificMarketIds = ['588667', '591762']
  
  // Get specific markets
  const specificMarkets = await prisma.market.findMany({
    where: {
      id: {
        in: specificMarketIds
      }
    },
    include: {
      event: true
    }
  })
  
  // Also get a trending market with high volume
  const trendingMarket = await prisma.market.findFirst({
    where: {
      active: true,
      closed: false,
      volume: {
        gt: 100000 // Markets with over $100k volume
      },
      // Exclude the specific markets we already have
      id: {
        notIn: specificMarketIds
      }
    },
    orderBy: {
      volume: 'desc'
    },
    include: {
      event: true
    }
  })

  const markets = [...specificMarkets]
  if (trendingMarket) {
    markets.push(trendingMarket)
  }

  if (markets.length === 0) {
    throw new Error('No suitable test markets found')
  }

  return markets
}

interface TestResult {
  marketId: string
  marketQuestion: string
  source: string
  success: boolean
  duration?: number
  error?: string
  linksCount?: number
  contentLength?: number
  cached?: boolean
}

async function testResearchIntegrations() {
  const testResults: TestResult[] = []
  
  try {
    console.log('🔍 Testing Research Integrations\n')
    console.log('=' .repeat(60))
    
    // 1. Validate environment setup
    console.log('\n📋 ENVIRONMENT VALIDATION')
    console.log('-'.repeat(40))
    const envStatus = validateResearchSourceEnvironment()
    
    if (envStatus.available.length > 0) {
      console.log('✅ Available research sources:', envStatus.available.join(', '))
    }
    
    if (envStatus.missing.length > 0) {
      console.log('⚠️  Missing API keys:', envStatus.missing.join(', '))
    }
    
    if (envStatus.errors.length > 0) {
      console.log('❌ Configuration errors:', envStatus.errors.join(', '))
    }

    // 2. Get test markets
    console.log('\n🎯 SELECTING TEST MARKETS')
    console.log('-'.repeat(40))
    const markets = await getTestMarkets()
    console.log(`Found ${markets.length} markets to test:`)
    markets.forEach((market, i) => {
      console.log(`  ${i + 1}. ${market.question} (ID: ${market.id}, Volume: $${market.volume?.toLocaleString()})`)
    })
    
    // Option to clear cache for fresh test
    const clearCache = process.argv.includes('--clear-cache')
    
    // 3. Test Exa.ai Integration for all markets
    console.log('\n🔬 TESTING EXA.AI INTEGRATION')
    console.log('-'.repeat(40))
    
    if (envStatus.available.includes('exa')) {
      for (const market of markets) {
        console.log(`\n📍 Testing Exa for: ${market.question} (ID: ${market.id})`)
        
        try {
          if (clearCache) {
            await prisma.researchCache.deleteMany({
              where: {
                marketId: market.id,
                source: 'exa'
              }
            })
          }
          
          const startTime = Date.now()
          const exaResult = await performExaResearch(prisma, market.id)
          const duration = Date.now() - startTime
          
          // Check if results were cached
          const cachedResult = await prisma.researchCache.findFirst({
            where: {
              marketId: market.id,
              source: 'exa'
            },
            orderBy: {
              createdAt: 'desc'
            }
          })
          
          // Store test result
          testResults.push({
            marketId: market.id,
            marketQuestion: market.question,
            source: 'exa',
            success: true,
            duration,
            linksCount: exaResult.links.length,
            contentLength: exaResult.relevant_information.length,
            cached: !!cachedResult
          })
          
          console.log(`  ✅ Success in ${duration}ms`)
          console.log(`  📄 Content: ${exaResult.relevant_information.length} chars`)
          console.log(`  🔗 Links: ${exaResult.links.length}`)
          console.log(`  📊 Confidence: ${exaResult.confidence_score}`)
          
          // Show sample content for first market only
          if (market === markets[0]) {
            console.log(`\n  Sample content (first 300 chars):`)
            console.log(`  ${exaResult.relevant_information.substring(0, 300)}...`)
            console.log(`\n  Sample links:`)
            exaResult.links.slice(0, 3).forEach((link, i) => console.log(`    ${i + 1}. ${link}`))
          }
          
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error)
          testResults.push({
            marketId: market.id,
            marketQuestion: market.question,
            source: 'exa',
            success: false,
            error: errorMsg
          })
          console.log(`  ❌ Failed: ${errorMsg}`)
        }
      }
    } else {
      console.log('⏭️  Skipping Exa.ai - API key not configured')
    }
    
    // 4. Test Grok Integration for all markets
    console.log('\n🤖 TESTING GROK (X/TWITTER) INTEGRATION')
    console.log('-'.repeat(40))
    
    if (envStatus.available.includes('grok')) {
      for (const market of markets) {
        console.log(`\n📍 Testing Grok for: ${market.question} (ID: ${market.id})`)
        
        try {
          if (clearCache) {
            await prisma.researchCache.deleteMany({
              where: {
                marketId: market.id,
                source: 'grok'
              }
            })
          }
          
          const startTime = Date.now()
          const grokResult = await performGrokResearch(prisma, market.id)
          const duration = Date.now() - startTime
          
          // Check if results were cached
          const cachedResult = await prisma.researchCache.findFirst({
            where: {
              marketId: market.id,
              source: 'grok'
            },
            orderBy: {
              createdAt: 'desc'
            }
          })
          
          // Store test result
          testResults.push({
            marketId: market.id,
            marketQuestion: market.question,
            source: 'grok',
            success: true,
            duration,
            linksCount: grokResult.links.length,
            contentLength: grokResult.relevant_information.length,
            cached: !!cachedResult
          })
          
          console.log(`  ✅ Success in ${duration}ms`)
          console.log(`  📄 Content: ${grokResult.relevant_information.length} chars`)
          console.log(`  🔗 Links: ${grokResult.links.length}`)
          console.log(`  📊 Confidence: ${grokResult.confidence_score}`)
          
          // Show sample content for first market only
          if (market === markets[0]) {
            console.log(`\n  Sample content (first 300 chars):`)
            console.log(`  ${grokResult.relevant_information.substring(0, 300)}...`)
            if (grokResult.sentiment_analysis) {
              console.log(`\n  Sentiment: ${grokResult.sentiment_analysis.substring(0, 200)}`)
            }
            if (grokResult.key_accounts && grokResult.key_accounts.length > 0) {
              console.log(`  Key Accounts: ${grokResult.key_accounts.slice(0, 5).join(', ')}`)
            }
          }
          
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error)
          testResults.push({
            marketId: market.id,
            marketQuestion: market.question,
            source: 'grok',
            success: false,
            error: errorMsg
          })
          console.log(`  ❌ Failed: ${errorMsg}`)
        }
      }
    } else {
      console.log('⏭️  Skipping Grok - OpenRouter API key not configured')
    }
    
    // 5. Test unified research interface (test with first market only)
    console.log('\n🔄 TESTING UNIFIED RESEARCH INTERFACE')
    console.log('-'.repeat(40))
    
    const testSource = envStatus.available[0]
    if (testSource && markets.length > 0) {
      const testMarket = markets[0]
      try {
        console.log(`Testing unified interface with source: ${testSource}`)
        console.log(`Market: ${testMarket.question} (ID: ${testMarket.id})`)
        
        const startTime = Date.now()
        const unifiedResult = await performMarketResearchV2(
          prisma,
          testMarket.id,
          testSource
        )
        const duration = Date.now() - startTime
        
        console.log(`✅ Unified interface worked for ${testSource} in ${duration}ms`)
        console.log(`Result source: ${unifiedResult.source}`)
      } catch (error) {
        console.log('❌ Unified interface test failed:', error instanceof Error ? error.message : error)
      }
    }
    
    // 6. Test Summary
    console.log('\n📊 TEST SUMMARY')
    console.log('='.repeat(60))
    
    // Group results by market
    const marketGroups = new Map<string, TestResult[]>()
    testResults.forEach(result => {
      const key = result.marketId
      if (!marketGroups.has(key)) {
        marketGroups.set(key, [])
      }
      marketGroups.get(key)!.push(result)
    })
    
    // Display summary for each market
    marketGroups.forEach((results, marketId) => {
      const market = markets.find(m => m.id === marketId)
      console.log(`\n📍 Market: ${market?.question || 'Unknown'}`)
      console.log(`   ID: ${marketId}`)
      
      results.forEach(result => {
        if (result.success) {
          console.log(`   ✅ ${result.source}: ${result.duration}ms, ${result.linksCount} links, ${result.contentLength} chars${result.cached ? ' (cached)' : ''}`)
        } else {
          console.log(`   ❌ ${result.source}: ${result.error?.substring(0, 50)}...`)
        }
      })
    })
    
    // Overall statistics
    const successful = testResults.filter(r => r.success).length
    const failed = testResults.filter(r => !r.success).length
    const avgDuration = testResults
      .filter(r => r.success && r.duration)
      .reduce((sum, r) => sum + (r.duration || 0), 0) / successful || 0
    
    console.log('\n📈 OVERALL STATISTICS')
    console.log('-'.repeat(40))
    console.log(`Total Tests: ${testResults.length}`)
    console.log(`Successful: ${successful}`)
    console.log(`Failed: ${failed}`)
    console.log(`Average Duration: ${Math.round(avgDuration)}ms`)
    console.log(`Markets Tested: ${markets.length}`)
    console.log(`Sources Tested: ${[...new Set(testResults.map(r => r.source))].join(', ')}`)
    
    console.log('\n' + '='.repeat(60))
    console.log('✅ Research Integration Tests Complete!')
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('\n❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the tests
if (require.main === module) {
  testResearchIntegrations().catch(console.error)
}

export { testResearchIntegrations }