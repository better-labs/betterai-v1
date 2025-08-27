import type { PrismaClient, Market, Event, Tag, Prediction } from '@/lib/generated/prisma'
import * as marketService from './market-service'
import * as eventService from './event-service'
import * as tagService from './tag-service'
import { mapSearchResultToDTO, type SearchResultDTO } from '@/lib/dtos/search-result-dto'
import type { MarketDTO, EventDTO, PredictionDTO } from '@/lib/types'

/**
 * Search service functions following clean service pattern:
 * - Accept db instance for dependency injection
 * - Delegate to individual service functions
 * - Return consistent search result format
 * - Clean named exports instead of object namespaces
 */

export async function searchAll(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  searchTerm: string,
  options?: {
    includeMarkets?: boolean
    includeEvents?: boolean  
    includeTags?: boolean
    limit?: number
    marketOptions?: Parameters<typeof marketService.searchMarkets>[2]
  }
): Promise<{
  markets: Array<Market & { event: Event | null, predictions: Prediction[] }>
  events: Array<Event & { markets?: Market[] }>
  tags: Array<Tag & { eventCount?: number }>
  totalResults: number
  suggestions?: string[]
}> {
  const limit = options?.limit ?? 10
  const includeMarkets = options?.includeMarkets ?? true
  const includeEvents = options?.includeEvents ?? true
  const includeTags = options?.includeTags ?? true

  // Run searches in parallel for better performance
  const [marketsResult, events, tags] = await Promise.all([
    includeMarkets 
      ? marketService.searchMarkets(db, searchTerm, { 
          ...options?.marketOptions, 
          limit 
        })
      : { items: [], nextCursor: null },
    includeEvents 
      ? eventService.searchEvents(db, searchTerm, { 
          limit, 
          includeMarkets: false 
        })
      : [],
    includeTags 
      ? tagService.searchTags(db, searchTerm, { 
          limit, 
          includeEventCounts: true 
        })
      : []
  ])

  const totalResults = marketsResult.items.length + events.length + tags.length

  return {
    markets: marketsResult.items,
    events,
    tags,
    totalResults,
    suggestions: totalResults === 0 ? await generateSearchSuggestions(db, searchTerm) : undefined
  }
}

export async function searchAllSerialized(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  searchTerm: string,
  options?: {
    includeMarkets?: boolean
    includeEvents?: boolean  
    includeTags?: boolean
    limit?: number
    marketOptions?: Parameters<typeof marketService.searchMarkets>[2]
  }
): Promise<SearchResultDTO> {
  const result = await searchAll(db, searchTerm, options)
  return mapSearchResultToDTO(result)
}

/**
 * Generate search suggestions when no results are found
 */
async function generateSearchSuggestions(
  db: PrismaClient | Omit<PrismaClient, '$disconnect' | '$connect' | '$executeRaw' | '$executeRawUnsafe' | '$queryRaw' | '$queryRawUnsafe' | '$transaction'>,
  searchTerm: string
): Promise<string[]> {
  // Get popular tags as suggestions
  const popularTags = await tagService.getPopularTagsByMarketVolume(db, 5)
  const suggestions = popularTags.map(tag => tag.label)
  
  // Add some common search patterns
  const commonSuggestions = [
    'election',
    'politics', 
    'sports',
    'crypto',
    'stock market'
  ].filter(s => !suggestions.includes(s))
  
  return [...suggestions, ...commonSuggestions].slice(0, 5)
}