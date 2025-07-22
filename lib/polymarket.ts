import { Market, MarketOutcome, RawPolymarketApiResponse, RawPolymarketMarket } from './types'

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
function transformRawMarket(rawMarket: any): Market | null {
  try {
    // Validate required fields exist
    if (!rawMarket.id || !rawMarket.question || !rawMarket.category) {
      console.warn('Missing required fields in market:', rawMarket.id);
      return null;
    }

    // Parse outcomes and prices
    const outcomes = parseJsonSafely<string[]>(rawMarket.outcomes, []);
    const outcomePrices = parseJsonSafely<string[]>(rawMarket.outcomePrices, []);

    // Validate outcomes data
    if (outcomes.length === 0 || outcomes.length !== outcomePrices.length) {
      console.warn(`Invalid outcomes data for market ${rawMarket.id}:`, {
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
    const volume = rawMarket.volumeNum ?? parseFloat(rawMarket.volume) ?? 0;
    const liquidity = rawMarket.liquidityNum ?? parseFloat(rawMarket.liquidity) ?? 0;

    // Create market URL from slug
    const marketURL = rawMarket.slug 
      ? `https://polymarket.com/market/${rawMarket.slug}`
      : `https://polymarket.com/market/${rawMarket.id}`;

    return {
      id: rawMarket.id,
      question: rawMarket.question,
      description: rawMarket.description || '',
      volume: volume,
      liquidity: liquidity,
      outcomes: transformedOutcomes,
      endDate: rawMarket.endDate || '',
      category: rawMarket.category,
      marketURL: marketURL
    };

  } catch (error) {
    console.error(`Error transforming market ${rawMarket?.id}:`, error);
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
 * Main function to fetch and process Polymarket data
 */
export async function getTopPolyMarkets(): Promise<Market[]> {
  const options = { method: 'GET' };

  try {
    const limit = 7;
    const response = await fetch(`https://gamma-api.polymarket.com/markets?limit=${limit}&sortBy=volume24h&ascending=false`, options);
    
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

  } catch (err) {
    console.error('Error fetching Polymarket data:', err);
    throw err;
  }
} 