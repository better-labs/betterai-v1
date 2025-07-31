import { getTopPolyMarkets, cacheUtils } from '../lib/polymarket';
import { Market } from '../lib/types';

// Mock the actual API structure we discovered
const mockRawApiResponse = [
  {
    id: "12",
    question: "Will Joe Biden get Coronavirus before the election?",
    description: "This is a market on if presidential candidate Joe Biden will test positive for COVID-19 before November 3rd, 2020.",
    volume: "32257.445115",
    volumeNum: 32257.45,
    liquidity: "0",
    liquidityNum: 0,
    outcomes: "[\"Yes\", \"No\"]",
    outcomePrices: "[\"0\", \"0\"]",

    slug: "will-joe-biden-get-coronavirus-before-the-election",
    active: true,
    closed: true
  },
  {
    id: "13",
    question: "Will Bitcoin reach $100,000 by end of 2024?",
    description: "Bitcoin price prediction market",
    volume: "1000000.50",
    volumeNum: 1000000.5,
    liquidity: "500000.25",
    liquidityNum: 500000.25,
    outcomes: "[\"Yes\", \"No\"]",
    outcomePrices: "[\"0.65\", \"0.35\"]",

    slug: "bitcoin-100k-2024",
    active: true,
    closed: false
  }
];

// Mock fetch
global.fetch = jest.fn();

describe('Polymarket Data Processing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear cache before each test
    cacheUtils.clearCache();
  });

  test('should transform API response correctly', async () => {
    // Mock successful API response
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockRawApiResponse,
    } as any);

    const markets = await getTopPolyMarkets(7, false); // Disable cache for predictable testing
    
    expect(Array.isArray(markets)).toBe(true);
    expect(markets).toHaveLength(2);
    
    // Test first market transformation
    const firstMarket = markets[0];
    expect(firstMarket.id).toBe("12");
    expect(firstMarket.question).toBe("Will Joe Biden get Coronavirus before the election?");
    expect(firstMarket.volume).toBe("32257.45");
    expect(firstMarket.liquidity).toBe("0");


    expect(firstMarket.marketURL).toBeUndefined();
    
    // Test outcomes transformation
    expect(firstMarket.outcomes).toBeUndefined();
    
    // Test second market transformation
    const secondMarket = markets[1];
    expect(secondMarket.id).toBe("13");
    expect(secondMarket.question).toBe("Will Bitcoin reach $100,000 by end of 2024?");
    expect(secondMarket.volume).toBe("1000000.5");
    expect(secondMarket.liquidity).toBe("500000.25");
    expect(secondMarket.outcomes).toBeUndefined();
  });

  test('should handle malformed data gracefully', async () => {
    const malformedData = [
      {
        id: "bad1",
        // Missing required fields
        volume: "invalid",
        outcomes: "invalid json",
        outcomePrices: "[\"0.5\"]" // mismatched length
      },
      {
        id: "good1",
        question: "Valid question?",
        description: "Valid description",
        volume: "1000",
        volumeNum: 1000,
        liquidity: "500",
        liquidityNum: 500,
        outcomes: "[\"Yes\", \"No\"]",
        outcomePrices: "[\"0.6\", \"0.4\"]",

        slug: "valid-market",
        active: true,
        closed: false
      }
    ];

    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => malformedData,
    } as any);

    const markets = await getTopPolyMarkets(7, false); // Disable cache for predictable testing
    
    // Should only return the valid market
    expect(markets).toHaveLength(1);
    expect(markets[0].id).toBe("good1");
    expect(markets[0].question).toBe("Valid question?");
  });

  test('should handle API errors', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: false,
      status: 500,
    } as any);

    await expect(getTopPolyMarkets(7, false)).rejects.toThrow('HTTP error! status: 500');
  });

  test('should handle network errors', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(new Error('Network error'));

    await expect(getTopPolyMarkets(7, false)).rejects.toThrow('Network error');
  });

  // Caching tests
  describe('Caching functionality', () => {
    test('should cache API responses', async () => {
      // Mock successful API response
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockRawApiResponse,
      } as any);

      // First call should hit API
      const markets1 = await getTopPolyMarkets(7, true);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(markets1).toHaveLength(2);

      // Second call should use cache
      const markets2 = await getTopPolyMarkets(7, true);
      expect(fetch).toHaveBeenCalledTimes(1); // Should still be 1
      expect(markets2).toHaveLength(2);
      expect(markets2).toEqual(markets1);
    });

    test('should handle different cache keys for different limits', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockRawApiResponse,
      } as any);

      // Different limits should create different cache entries
      await getTopPolyMarkets(5, true);
      await getTopPolyMarkets(10, true);
      
      expect(fetch).toHaveBeenCalledTimes(2);
      
      const stats = cacheUtils.getCacheStats();
      expect(stats.size).toBe(2);
      expect(stats.keys).toContain('polymarket_markets_5');
      expect(stats.keys).toContain('polymarket_markets_10');
    });

    test('should allow cache bypass', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockRawApiResponse,
      } as any);

      // First call with cache enabled
      await getTopPolyMarkets(7, true);
      expect(fetch).toHaveBeenCalledTimes(1);

      // Second call with cache disabled should hit API again
      await getTopPolyMarkets(7, false);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    test('should provide cache utility functions', () => {
      // Test cache stats for empty cache
      let stats = cacheUtils.getCacheStats();
      expect(stats.size).toBe(0);
      expect(stats.keys).toEqual([]);

      // Check if data is cached (should be false)
      expect(cacheUtils.isCached(7)).toBe(false);

      // Check expiry time (should be null)
      expect(cacheUtils.getTimeUntilExpiry(7)).toBe(null);
    });

    test('should clear cache correctly', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockRawApiResponse,
      } as any);

      // Add data to cache
      await getTopPolyMarkets(7, true);
      expect(cacheUtils.getCacheStats().size).toBe(1);
      expect(cacheUtils.isCached(7)).toBe(true);

      // Clear cache
      cacheUtils.clearCache();
      expect(cacheUtils.getCacheStats().size).toBe(0);
      expect(cacheUtils.isCached(7)).toBe(false);
    });
  });
}); 