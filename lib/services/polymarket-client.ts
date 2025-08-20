import type { PolymarketEvent } from '@/lib/types';

const POLYMARKET_API_BASE_URL = 'https://gamma-api.polymarket.com';

interface FetchOptions {
  limit?: number;
  delayMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
  userAgent?: string;
}

async function fetchWithRetry(url: string, options: FetchOptions, attempt: number = 1): Promise<Response> {
  const { maxRetries = 3, retryDelayMs = 2000, timeoutMs = 30000, userAgent = "BetterAI/1.0" } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": userAgent,
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 429 && attempt <= maxRetries) {
        console.log(`Rate limited. Retrying in ${retryDelayMs * attempt}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelayMs * attempt));
        return fetchWithRetry(url, options, attempt + 1);
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (attempt <= maxRetries) {
      console.error(`Fetch attempt ${attempt} failed: ${error}. Retrying in ${retryDelayMs * attempt}ms...`);
      await new Promise(resolve => setTimeout(resolve, retryDelayMs * attempt));
      return fetchWithRetry(url, options, attempt + 1);
    }
    throw error;
  }
}

function formatDateYYYYMMDD(input: Date | string): string {
  if (input instanceof Date) {
    return input.toISOString().split('T')[0];
  }
  return input;
}

export async function fetchPolymarketEvents(
  offset: number,
  limit: number,
  startDateMin: Date | string,
  endDateMax: Date | string,
  options: FetchOptions,
  sortBy?: string
): Promise<PolymarketEvent[]> {
  const startDate = formatDateYYYYMMDD(startDateMin);
  const endDate = formatDateYYYYMMDD(endDateMax);
  
  // Build params with optional sortBy
  let params = `start_date_min=${startDate}&end_date_max=${endDate}&offset=${offset}&limit=${limit}`;
  
  if (sortBy) {
    // When sorting by volume, use descending order to get highest volume first
    const ascending = sortBy.includes('volume') ? 'false' : 'true';
    params += `&sortBy=${sortBy}&ascending=${ascending}`;
  } else {
    // Default behavior: ascending by date
    params += `&ascending=true`;
  }
  
  const url = `${POLYMARKET_API_BASE_URL}/events?${params}`;

  console.log(`Fetching Polymarket events: ${url}`);
  const response = await fetchWithRetry(url, options);
  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error("Invalid response format from Polymarket API");
  }

  return data;
}
