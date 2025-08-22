import type { Market, Event, Tag, Prediction } from '../../../lib/generated/prisma';
import { marketQueries } from './market'
import { eventQueries } from './event'
import { tagQueries } from './tag'
import { serializeDecimals } from '../../serialization'
import type { MarketDTO, EventDTO, PredictionDTO } from '../../types'

// Unified search functionality
export const searchQueries = {
  /**
   * Unified search across all entity types
   */
  searchAll: async (
    searchTerm: string,
    options?: {
      includeMarkets?: boolean
      includeEvents?: boolean  
      includeTags?: boolean
      limit?: number
      marketOptions?: Parameters<typeof marketQueries.searchMarkets>[1]
    }
  ): Promise<{
    markets: Array<Market & { event: Event | null, predictions: Prediction[] }>
    events: Array<Event & { markets?: Market[] }>
    tags: Array<Tag & { eventCount?: number }>
    totalResults: number
    suggestions?: string[]
  }> => {
    const limit = options?.limit ?? 10
    const includeMarkets = options?.includeMarkets ?? true
    const includeEvents = options?.includeEvents ?? true
    const includeTags = options?.includeTags ?? true

    // Run searches in parallel for better performance
    const [marketsResult, events, tags] = await Promise.all([
      includeMarkets 
        ? marketQueries.searchMarkets(searchTerm, { 
            ...options?.marketOptions, 
            limit 
          })
        : { items: [], nextCursor: null },
      includeEvents 
        ? eventQueries.searchEvents(searchTerm, { 
            limit, 
            includeMarkets: false 
          })
        : [],
      includeTags 
        ? tagQueries.searchTags(searchTerm, { 
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
      suggestions: totalResults === 0 ? await generateSearchSuggestions(searchTerm) : undefined
    }
  },

  /**
   * Unified search across all entity types - Serialized version
   */
  searchAllSerialized: async (
    searchTerm: string,
    options?: {
      includeMarkets?: boolean
      includeEvents?: boolean  
      includeTags?: boolean
      limit?: number
      marketOptions?: Parameters<typeof marketQueries.searchMarkets>[1]
    }
  ): Promise<{
    markets: Array<MarketDTO & { event: EventDTO | null, predictions: PredictionDTO[] }>
    events: Array<EventDTO & { markets?: MarketDTO[] }>
    tags: Array<Tag & { eventCount?: number }>
    totalResults: number
    suggestions?: string[]
  }> => {
    const result = await searchQueries.searchAll(searchTerm, options)
    return serializeDecimals(result) as any
  }
}

/**
 * Generate search suggestions when no results are found
 */
async function generateSearchSuggestions(searchTerm: string): Promise<string[]> {
  // Get popular tags as suggestions
  const popularTags = await tagQueries.getPopularTagsByMarketVolume(5)
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