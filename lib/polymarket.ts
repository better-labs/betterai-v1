import { Market } from './types'

export async function getTopPolyMarkets(): Promise<Market[]> {
  const options = { method: 'GET' };

  try {
    const limit = 7;
    const response = await fetch(`https://gamma-api.polymarket.com/markets?limit=${limit}&sortBy=volume24h&order=desc`, options);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (err) {
    console.error('Error fetching Polymarket data:', err);
    throw err;
  }
} 