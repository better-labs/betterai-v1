import { Market, MarketOutcome, RawPolymarketApiResponse, RawPolymarketMarket, PolymarketEvent } from './types'

// Simple cache implementation with TTL
interface CacheEntry {
  data: Market[]
  timestamp: number
  ttl: number
}

class SimpleCache {
  private cache = new Map<string, CacheEntry>()

  set(key: string, data: Market[], ttlMs: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    })
  }

  get(key: string): Market[] | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  clear(): void {
    this.cache.clear()
  }

  // Get cache stats for debugging
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

// Create cache instance
const marketCache = new SimpleCache()

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const CACHE_KEY_PREFIX = 'polymarket_markets'

/**
 * Validates that a value is a valid JSON string and parses it
 */
function parseJsonSafely<T>(jsonString: string, fallback: T): T {
  try {
    const parsed = JSON.parse(jsonString);
    return parsed;
  } catch (error) {
    console.warn(`Failed to parse JSON: ${jsonString}`, error);
    return fallback;
  }
}

/**
 * Validates and transforms a single raw market from Polymarket API
 */
function transformRawMarket(rawMarket: unknown): Market | null {
  try {
    // Type guard to ensure rawMarket is an object with expected properties
    if (!rawMarket || typeof rawMarket !== 'object') {
      console.warn('Invalid market data: not an object');
      return null;
    }
    
    const market = rawMarket as any;
    
    // Validate required fields exist
    if (!market.id || !market.question) {
      console.warn('Missing required fields in market:', market.id);
      return null;
    }

    // Parse outcomes and prices
    const outcomes = parseJsonSafely<string[]>(market.outcomes, []);
    const outcomePrices = parseJsonSafely<string[]>(market.outcomePrices, []);

    // Validate outcomes data
    if (outcomes.length === 0 || outcomes.length !== outcomePrices.length) {
      console.warn(`Invalid outcomes data for market ${market.id}:`, {
        outcomes,
        outcomePrices
      });
      return null;
    }

    // Transform outcomes to our format
    const transformedOutcomes: MarketOutcome[] = outcomes.map((name, index) => ({
      name: name,
      price: parseFloat(outcomePrices[index]) || 0
    }));

    // Get numeric values, preferring the Num versions
    const volume = market.volumeNum ?? parseFloat(market.volume) ?? 0;
    const liquidity = market.liquidityNum ?? parseFloat(market.liquidity) ?? 0;

    // Create market URL from slug
    const marketURL = market.slug 
      ? `https://polymarket.com/market/${market.slug}`
      : `https://polymarket.com/market/${market.id}`;

    return {
      id: market.id,
      question: market.question,
      outcomePrices: null,
      volume: volume.toString(),
      liquidity: liquidity.toString(),
      updatedAt: null,
      eventId: null
    };

  } catch (error) {
    console.error(`Error transforming market:`, error);
    return null;
  }
}

/**
 * Validates the API response structure
 */
function validateApiResponse(data: unknown): data is RawPolymarketApiResponse {
  if (!Array.isArray(data)) {
    console.error('API response is not an array');
    return false;
  }

  if (data.length === 0) {
    console.warn('API response is empty array');
    return true; // Empty array is valid
  }

  // Check first item has required structure
  const firstItem = data[0];
  if (!firstItem || typeof firstItem !== 'object') {
    console.error('First item in response is not an object');
    return false;
  }

  return true;
}

/**
 * Fetches data from Polymarket API (without cache)
 */
async function fetchMarketsFromAPI(limit: number): Promise<Market[]> {
  const options = { method: 'GET' };
  const endDateMin = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString().split('T')[0];

  console.log(`endDateMin: ${endDateMin}`);
  console.log(`limit: ${limit}`);
  
  const response = await fetch(`https://gamma-api.polymarket.com/events?limit=${limit}&sortBy=volume24h&ascending=false&end_date_min=${endDateMin}closed=false`, options);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  // Step 1: Parse JSON (this validates JSON syntax)
  const rawData = await response.json();
  
  // Step 2: Validate response structure
  if (!validateApiResponse(rawData)) {
    throw new Error('Invalid API response structure');
  }

  // Step 3: Transform and filter valid markets
  const transformedMarkets: Market[] = rawData
    .map(transformRawMarket)
    .filter((market): market is Market => market !== null);

  console.log(`Successfully processed ${transformedMarkets.length} out of ${rawData.length} markets`);
  
  return transformedMarkets;
}

/**
 * Main function to fetch and process Polymarket data with caching
 */
export async function getTopPolyMarkets(limit: number = 7, useCache: boolean = true): Promise<Market[]> {
  try {
    // Generate cache key based on parameters
    const cacheKey = `${CACHE_KEY_PREFIX}_${limit}`;

    // Check cache first if enabled
    if (useCache) {
      const cachedData = marketCache.get(cacheKey);
      if (cachedData) {
        console.log(`Returning cached data for key: ${cacheKey}`);
        return cachedData;
      }
    }

    console.log(`Cache miss for key: ${cacheKey}, fetching from API...`);

    // Fetch fresh data from API
    const freshData = await fetchMarketsFromAPI(limit);

    // Store in cache if we got valid data
    if (useCache && freshData.length > 0) {
      marketCache.set(cacheKey, freshData, CACHE_TTL);
      console.log(`Cached ${freshData.length} markets for ${CACHE_TTL / 1000}s`);
    }

    return freshData;

  } catch (err) {
    console.error('Error fetching Polymarket data:', err);
    throw err;
  }
}

/**
 * Fetches a single event from Polymarket API by ID
 */
export async function getEventById(eventId: string): Promise<PolymarketEvent | null> {
  try {
    const response = await fetch(`https://gamma-api.polymarket.com/events/${eventId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const eventData = await response.json();
    
    // Validate the event data structure
    if (!eventData || !eventData.id || !eventData.title) {
      console.warn('Invalid event data structure:', eventData);
      return null;
    }
    
    // Transform to our PolymarketEvent interface
    const event: PolymarketEvent = {
      id: eventData.id,
      title: eventData.title,
      description: eventData.description || '',
      slug: eventData.slug || '',
      icon: eventData.icon || '',
      tags: eventData.tags || [],
      endTime: eventData.endTime || '',
      volume: eventData.volume || 0,
      markets: eventData.markets || []
    };
    
    return event;
  } catch (error) {
    console.error('Error fetching event from Polymarket:', error);
    return null;
  }
}

/**
 * Utility functions for cache management
 */
export const cacheUtils = {
  /**
   * Clear all cached market data
   */
  clearCache(): void {
    marketCache.clear();
    console.log('Market cache cleared');
  },

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return marketCache.getStats();
  },

  /**
   * Check if data exists in cache for given parameters
   */
  isCached(limit: number = 7): boolean {
    const cacheKey = `${CACHE_KEY_PREFIX}_${limit}`;
    return marketCache.get(cacheKey) !== null;
  },

  /**
   * Get time until cache expires for given parameters (in seconds)
   */
  getTimeUntilExpiry(limit: number = 7): number | null {
    const cacheKey = `${CACHE_KEY_PREFIX}_${limit}`;
    const entry = marketCache['cache'].get(cacheKey);
    
    if (!entry) {
      return null;
    }

    const timeLeft = entry.ttl - (Date.now() - entry.timestamp);
    return Math.max(0, Math.floor(timeLeft / 1000));
  }
} 