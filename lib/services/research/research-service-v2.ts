import type { PrismaClient } from '@/lib/generated/prisma'
import { z } from 'zod'
import { fetchStructuredFromOpenRouter } from '../openrouter-client'
import { getMarketById } from '../market-service'
import { createResearchCache, getCachedResearchBySource } from '../research-cache-service'
import { RESEARCH_SOURCES, getResearchSource } from '@/lib/config/research-sources'

/**
 * Research Service V2 - Phase 1 Implementation
 * Supports multiple research sources with unified interface
 * Uses many-to-many relationship architecture
 */

/**
 * Helper function to check and return cached research if available
 * @returns ResearchResult if cache exists, null otherwise
 */
async function checkAndReturnCachedResearch(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  marketId: string,
  source: string
): Promise<ResearchResult | null> {
  const cachedResult = await getCachedResearchBySource(db, marketId, source)
  if (cachedResult) {
    console.log(`Using cached ${source} research for market ${marketId}`)
    const response = cachedResult.response as unknown as ResearchResult
    return {
      ...response,
      timestamp: cachedResult.createdAt || new Date() // Use cached timestamp with fallback
    }
  }
  return null
}

export interface ResearchResult {
  source: string
  relevant_information: string
  links: string[]
  confidence_score?: number
  timestamp: Date
  sentiment_analysis?: string
  key_accounts?: string[]
}

// Zod schemas for validation
export const ResearchResultSchema = z.object({
  source: z.string(),
  relevant_information: z.string().min(10),
  links: z.array(z.string().url()).min(1),
  confidence_score: z.number().min(0).max(1).optional(),
  timestamp: z.date(),
  sentiment_analysis: z.string().optional(),
  key_accounts: z.array(z.string()).optional()
})

const ExaResultSchema = z.object({
  relevant_information: z.string().min(10),
  links: z.array(z.string().url()).min(1)
})

const GrokResultSchema = z.object({
  relevant_information: z.string().min(10),
  links: z.array(z.string().url()).min(1),
  sentiment_analysis: z.string(),
  key_accounts: z.array(z.string())
})

/**
 * Main entry point for market research V2
 * Routes to appropriate research implementation based on source
 */
export async function performMarketResearchV2(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  marketId: string,
  researchSource: string,
  modelName?: string
): Promise<ResearchResult> {
  // Validate research source
  const sourceConfig = getResearchSource(researchSource)
  if (!sourceConfig) {
    throw new Error(`Unsupported research source: ${researchSource}`)
  }

  if (!sourceConfig.available) {
    throw new Error(`Research source ${researchSource} is not currently available`)
  }

  // Route to appropriate research implementation
  switch (researchSource) {
    case 'exa':
      return await performExaResearch(db, marketId, modelName)
    case 'grok':
      return await performGrokResearch(db, marketId, modelName)
    default:
      throw new Error(`Research source ${researchSource} not yet implemented`)
  }
}

/**
 * Exa.ai semantic search implementation
 * Phase 1: Advanced web search optimized for recent developments
 */
export async function performExaResearch(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  marketId: string,
  modelName?: string
): Promise<ResearchResult> {
  // 1. Check cache first
  const cachedResearch = await checkAndReturnCachedResearch(db, marketId, 'exa')
  if (cachedResearch) {
    return cachedResearch
  }

  // 2. Get market data
  const market = await getMarketById(db, marketId)
  if (!market) {
    throw new Error(`Market ${marketId} not found`)
  }

  // 3. Validate API key
  const exaApiKey = process.env.EXA_API_KEY
  if (!exaApiKey) {
    throw new Error('EXA_API_KEY environment variable not set')
  }

  // 4. Construct semantic search query and determine domains
  // Check if this is a sports market
  const isSportsMarket = market.question.toLowerCase().includes('vs.') || 
                         market.question.toLowerCase().includes('game') ||
                         market.question.toLowerCase().includes('match') ||
                         market.question.toLowerCase().includes('nfl') ||
                         market.question.toLowerCase().includes('nba') ||
                         market.question.toLowerCase().includes('mlb')
  
  // Use appropriate domains based on market type
  const searchDomains = isSportsMarket ? [
    'espn.com',
    'nfl.com',
    'theathletic.com',
    'profootballtalk.nbcsports.com',
    'cbssports.com',
    'si.com',
    'bleacherreport.com',
    'foxsports.com',
    'sports.yahoo.com'
  ] : [
    'reuters.com', 
    'bloomberg.com', 
    'cnn.com', 
    'bbc.com',
    'apnews.com',
    'wsj.com',
    'politico.com',
    'axios.com'
  ]
  
  // Enhance query for sports markets
  const searchQuery = isSportsMarket 
    ? `${market.question} NFL predictions odds injury report analysis ${new Date().getFullYear()}`
    : `${market.question} ${market.description || ''} recent developments news analysis`
  
  console.log(`Exa.ai search query: "${searchQuery}"`)
  console.log(`Using domains: ${searchDomains.slice(0, 3).join(', ')}...`)
  
  try {
    // 5. Call Exa.ai API
    const exaResponse = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': exaApiKey
      },
      body: JSON.stringify({
        query: searchQuery,
        num_results: 10,
        // Only use domain restriction for non-sports markets
        ...(isSportsMarket ? {} : { include_domains: searchDomains }),
        use_autoprompt: true,
        type: 'neural',
        category: 'news', // Use news for all markets
        text: true,
        highlights: {
          numSentences: 2,
          highlightsPerUrl: 3
        },
        start_published_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Last 14 days for more results
      })
    })

    if (!exaResponse.ok) {
      const errorText = await exaResponse.text()
      console.error('Exa.ai API error response:', errorText)
      throw new Error(`Exa.ai API error: ${exaResponse.status} ${exaResponse.statusText} - ${errorText}`)
    }

    const exaData = await exaResponse.json()
    
    // 6. Process and validate results
    console.log('Exa.ai response structure:', JSON.stringify(exaData, null, 2).substring(0, 500))
    
    if (!exaData.results || exaData.results.length === 0) {
      throw new Error('No results returned from Exa.ai')
    }

    // Parse content with proper priority: text > summary > highlights > snippet
    let relevant_information = exaData.results
      .map((r: any) => r.text ?? r.summary ?? (r.highlights?.join('\n')) ?? r.snippet ?? '')
      .filter((text: string) => text.length > 0)
      .join('\n\n')

    // If no text content, use titles and URLs as fallback
    if (!relevant_information && exaData.results.length > 0) {
      relevant_information = exaData.results
        .map((r: any) => `${r.title || 'Article'}: ${r.url}`)
        .join('\n')
    }

    const links = exaData.results
      .map((r: any) => r.url || r.link)
      .filter((url: string) => url && url.startsWith('http'))

    if (!relevant_information || links.length === 0) {
      console.error('Exa.ai results structure:', {
        hasResults: !!exaData.results,
        resultsLength: exaData.results?.length,
        firstResult: exaData.results?.[0],
        relevant_information,
        links
      })
      throw new Error('Invalid results from Exa.ai - missing content or links')
    }

    const result: ResearchResult = {
      source: 'exa',
      relevant_information,
      links,
      timestamp: new Date(),
      confidence_score: 0.8 // Exa.ai generally provides high-quality results
    }

    // 7. Cache results
    await createResearchCache(db, {
      marketId,
      source: 'exa',
      modelName: modelName || 'exa-search',
      systemMessage: 'Exa.ai semantic search',
      userMessage: searchQuery,
      response: result
    })

    return result

  } catch (error) {
    console.error('Exa.ai research failed:', error)
    throw new Error(`Exa.ai research failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Grok AI X (Twitter) research implementation  
 * Phase 1: X (Twitter) realtime research via Grok AI through OpenRouter
 */
export async function performGrokResearch(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  marketId: string,
  modelName?: string
): Promise<ResearchResult> {
  // 1. Check cache first
  const cachedResearch = await checkAndReturnCachedResearch(db, marketId, 'grok')
  if (cachedResearch) {
    return cachedResearch
  }

  // 2. Get market data
  const market = await getMarketById(db, marketId)
  if (!market) {
    throw new Error(`Market ${marketId} not found`)
  }

  // 3. Validate OpenRouter API key
  const openRouterApiKey = process.env.OPENROUTER_API_KEY
  if (!openRouterApiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable not set')
  }

  // 4. Construct system and user messages for X/Twitter analysis
  const systemMessage = `You are a research assistant specialized in X (Twitter) analysis. Your task is to search X (Twitter) for the most relevant and up-to-date information, discussions, sentiment, and trends related to the given prediction market to help AI models make accurate predictions.

Focus on:
- Recent tweets and discussions about the topic
- Sentiment analysis from influential accounts
- Breaking news or developments
- Key opinion leaders' perspectives  
- Viral content or trending hashtags related to the topic

Format your response as a JSON object with the following structure:
{
  "relevant_information": "A comprehensive summary of X (Twitter) sentiment, key discussions, and recent developments you found.",
  "links": ["list", "of", "relevant", "Twitter/X", "URLs"],
  "sentiment_analysis": "Overall sentiment (positive/negative/neutral) with key insights",
  "key_accounts": ["list", "of", "influential", "accounts", "discussing", "this", "topic"]
}

IMPORTANT: You *must* search X (Twitter) and the 'links' array cannot be empty. Return ONLY a valid JSON object. Do NOT wrap your response in markdown code blocks, backticks, or any other formatting. Return pure JSON.`

  const userMessage = `Please search X (Twitter) for the latest information, sentiment, and discussions regarding the following prediction market:

Market: "${market.question}"
${market.description ? `Market Description: ${market.description}` : ''}
${market.endDate ? `Market End Date: ${market.endDate.toISOString().split('T')[0]}` : ''}
${market.resolutionSource ? `Resolution Source: ${market.resolutionSource}` : ''}

Focus on recent X (Twitter) activity, sentiment from key accounts, breaking news, viral content, and trending discussions that could influence the outcome of this prediction market. Pay special attention to:
- Official accounts related to the topic
- News outlets reporting on X
- Expert commentary and analysis
- Public sentiment and reaction
- Any recent developments or announcements

Analyze the overall Twitter/X sentiment and provide insights that would help AI models understand the current social media landscape around this prediction.`

  try {
    // 5. JSON Schema for structured output validation
    const grokSchemaJson = {
      type: 'object',
      additionalProperties: false,
      required: ['relevant_information', 'links', 'sentiment_analysis', 'key_accounts'],
      properties: {
        relevant_information: { type: 'string', minLength: 10 },
        links: {
          type: 'array',
          items: { type: 'string', minLength: 1 },
          minItems: 1,
        },
        sentiment_analysis: { type: 'string', minLength: 5 },
        key_accounts: {
          type: 'array',
          items: { type: 'string', minLength: 1 }
        }
      },
    } as const

    // 6. Call OpenRouter with Grok model for X/Twitter search
    const grokModel = 'x-ai/grok-4' // Use Grok 4 model with X/Twitter access
    const grokResult = await fetchStructuredFromOpenRouter<{
      relevant_information: string
      links: string[]
      sentiment_analysis: string  
      key_accounts: string[]
    }>(
      grokModel,
      systemMessage,
      userMessage,
      grokSchemaJson as unknown as Record<string, unknown>,
      GrokResultSchema,
      true // Enable X/Twitter search
    )

    const result: ResearchResult = {
      source: 'grok',
      relevant_information: grokResult.relevant_information,
      links: grokResult.links,
      sentiment_analysis: grokResult.sentiment_analysis,
      key_accounts: grokResult.key_accounts,
      timestamp: new Date(),
      confidence_score: 0.7 // Social media data can be less reliable than news
    }

    // 7. Cache results
    await createResearchCache(db, {
      marketId,
      source: 'grok',
      modelName: grokModel,
      systemMessage,
      userMessage,
      response: result
    })

    return result

  } catch (error) {
    console.error('Grok research failed:', error)
    throw new Error(`Grok research failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Helper function to get research results for a market from multiple sources
 * Useful for Phase 2+ when supporting multiple research sources per session
 */
export async function getMarketResearchResults(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  marketId: string,
  sources: string[]
): Promise<ResearchResult[]> {
  const results: ResearchResult[] = []
  
  for (const source of sources) {
    try {
      const result = await performMarketResearchV2(db, marketId, source)
      results.push(result)
    } catch (error) {
      console.warn(`Research failed for source ${source}:`, error)
      // Continue with other sources rather than failing entirely
    }
  }

  return results
}