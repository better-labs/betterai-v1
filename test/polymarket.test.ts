import { getTopPolyMarkets } from '../lib/polymarket';
import { Market } from '../lib/types';

// Mock global fetch
global.fetch = jest.fn();

describe('getTopPolyMarkets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.error to avoid cluttering test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should fetch and return top Polymarket markets successfully', async () => {
    const mockMarkets: Market[] = [
      {
        id: '1',
        question: 'Will Bitcoin reach $100,000 by end of 2024?',
        description: 'Market for Bitcoin price prediction',
        volume: 1000000,
        liquidity: 500000,
        outcomes: [
          { name: 'Yes', price: 0.65 },
          { name: 'No', price: 0.35 }
        ],
        endDate: '2024-12-31T23:59:59Z',
        category: 'Crypto',
        marketURL: 'https://polymarket.com/market/1'
      },
      {
        id: '2',
        question: 'Will Trump win the 2024 election?',
        description: 'Presidential election prediction market',
        volume: 2000000,
        liquidity: 1000000,
        outcomes: [
          { name: 'Yes', price: 0.52 },
          { name: 'No', price: 0.48 }
        ],
        endDate: '2024-11-05T23:59:59Z',
        category: 'Politics',
        marketURL: 'https://polymarket.com/market/2'
      }
    ];

    const mockResponse = {
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockMarkets),
    };

    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse as any);

    const result = await getTopPolyMarkets();

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      'https://gamma-api.polymarket.com/markets?limit=7&sortBy=volume24h&order=desc',
      { method: 'GET' }
    );
    expect(result).toEqual(mockMarkets);
    expect(result).toHaveLength(2);
    expect(result[0].question).toBe('Will Bitcoin reach $100,000 by end of 2024?');
  });

  it('should handle HTTP error responses', async () => {
    const mockResponse = {
      ok: false,
      status: 404,
      json: jest.fn(),
    };

    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse as any);

    await expect(getTopPolyMarkets()).rejects.toThrow('HTTP error! status: 404');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('should handle network errors', async () => {
    const networkError = new Error('Network error');
    (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(networkError);

    await expect(getTopPolyMarkets()).rejects.toThrow('Network error');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('should handle JSON parsing errors', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
    };

    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse as any);

    await expect(getTopPolyMarkets()).rejects.toThrow('Invalid JSON');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('should call the correct API endpoint with proper parameters', async () => {
    const mockMarkets: Market[] = [];
    const mockResponse = {
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockMarkets),
    };

    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse as any);

    await getTopPolyMarkets();

    expect(fetch).toHaveBeenCalledWith(
      'https://gamma-api.polymarket.com/markets?limit=7&sortBy=volume24h&order=desc',
      { method: 'GET' }
    );
  });

  it('should return empty array when API returns no markets', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue([]),
    };

    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse as any);

    const result = await getTopPolyMarkets();

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });
}); 