import { getTopPolyMarkets } from '../lib/polymarket';
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
    endDate: "2020-11-04T00:00:00Z",
    category: "US-current-affairs",
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
    endDate: "2024-12-31T23:59:59Z",
    category: "Crypto",
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
  });

  test('should transform API response correctly', async () => {
    // Mock successful API response
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockRawApiResponse,
    } as any);

    const markets = await getTopPolyMarkets();
    
    expect(Array.isArray(markets)).toBe(true);
    expect(markets).toHaveLength(2);
    
    // Test first market transformation
    const firstMarket = markets[0];
    expect(firstMarket.id).toBe("12");
    expect(firstMarket.question).toBe("Will Joe Biden get Coronavirus before the election?");
    expect(firstMarket.volume).toBe(32257.45);
    expect(firstMarket.liquidity).toBe(0);
    expect(firstMarket.category).toBe("US-current-affairs");
    expect(firstMarket.endDate).toBe("2020-11-04T00:00:00Z");
    expect(firstMarket.marketURL).toBe("https://polymarket.com/market/will-joe-biden-get-coronavirus-before-the-election");
    
    // Test outcomes transformation
    expect(firstMarket.outcomes).toHaveLength(2);
    expect(firstMarket.outcomes[0]).toEqual({ name: "Yes", price: 0 });
    expect(firstMarket.outcomes[1]).toEqual({ name: "No", price: 0 });
    
    // Test second market transformation
    const secondMarket = markets[1];
    expect(secondMarket.id).toBe("13");
    expect(secondMarket.question).toBe("Will Bitcoin reach $100,000 by end of 2024?");
    expect(secondMarket.volume).toBe(1000000.5);
    expect(secondMarket.liquidity).toBe(500000.25);
    expect(secondMarket.outcomes[0]).toEqual({ name: "Yes", price: 0.65 });
    expect(secondMarket.outcomes[1]).toEqual({ name: "No", price: 0.35 });
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
        endDate: "2024-12-31T00:00:00Z",
        category: "Test",
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

    const markets = await getTopPolyMarkets();
    
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

    await expect(getTopPolyMarkets()).rejects.toThrow('HTTP error! status: 500');
  });

  test('should handle network errors', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(new Error('Network error'));

    await expect(getTopPolyMarkets()).rejects.toThrow('Network error');
  });
}); 