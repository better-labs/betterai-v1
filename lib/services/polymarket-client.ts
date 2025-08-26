import type { PolymarketEvent } from '@/lib/types';
import { 
  validatePolymarketEvent,
  validatePolymarketEventSafe,
  ApiResponseValidationError 
} from '@/lib/validation/response-validator';

// Note: This file now primarily serves as a data fetcher for TanStack Query hooks.
// For React components, use the usePolymarketEvents hook from '@/lib/hooks/use-polymarket-events'
// which provides built-in caching, loading states, and error handling.

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
        // Rate limited - retrying
        await new Promise(resolve => setTimeout(resolve, retryDelayMs * attempt));
        return fetchWithRetry(url, options, attempt + 1);
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (attempt <= maxRetries) {
      // Fetch failed - retrying
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

// Convert DTO (with string dates) to server types (with Date objects)
function convertPolymarketEventDTOToServerType(eventDTO: any): PolymarketEvent {
  const toDateOrNull = (value: string | null | undefined): Date | null | undefined => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    if (typeof value === 'string') return new Date(value);
    return value as Date | null | undefined;
  };

  return {
    ...eventDTO,
    startDate: toDateOrNull(eventDTO.startDate),
    endDate: toDateOrNull(eventDTO.endDate),
    markets: (eventDTO.markets || []).map((market: any) => ({
      ...market,
      startDate: toDateOrNull(market.startDate),
      endDate: toDateOrNull(market.endDate),
    })),
  };
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
    // Filter sensitive logging in production
    if (process.env.NODE_ENV === 'production') {
      console.error('Polymarket API returned non-array response');
    } else {
      console.error('Polymarket API returned non-array response:', JSON.stringify(data, null, 2));
    }
    throw new Error("Invalid response format from Polymarket API - expected array");
  }

  // Validate each event in the response
  const validatedEvents: PolymarketEvent[] = [];
  const validationErrors: string[] = [];
  
  for (let i = 0; i < data.length; i++) {
    const eventData = data[i];
    const validationResult = validatePolymarketEventSafe(eventData);
    
    if (validationResult.success) {
      // Convert DTO (strings) to server types (Dates)
      const convertedEvent = convertPolymarketEventDTOToServerType(validationResult.data);
      validatedEvents.push(convertedEvent);
    } else {
      const errorMsg = `Event ${i}: ${validationResult.error}`;
      validationErrors.push(errorMsg);
      
      // Only log first few validation failures to avoid spam
      if (validationErrors.length <= 3) {
        // Suppress individual validation warnings - summary logged below
      }
    }
  }

  // If we have validation errors but some valid events, log summary but continue
  if (validationErrors.length > 0) {
    console.log(`Polymarket API: ${validationErrors.length}/${data.length} events failed validation.`);
    
    // If more than 50% of events failed validation, something might be seriously wrong
    if (validationErrors.length > data.length * 0.5) {
      throw new Error(`Too many validation failures (${validationErrors.length}/${data.length}). Polymarket API might have changed format.`);
    }
  }

  console.log(`Successfully validated ${validatedEvents.length}/${data.length} Polymarket events`);
  return validatedEvents;
}

/**
 * Fetch a single Polymarket event by ID with all its markets
 */
export async function fetchPolymarketEventById(
  eventId: string,
  options: FetchOptions = {}
): Promise<PolymarketEvent | null> {
  const url = `${POLYMARKET_API_BASE_URL}/events/${eventId}`;

  console.log(`Fetching Polymarket event by ID: ${url}`);
  
  try {
    const response = await fetchWithRetry(url, options);
    const data = await response.json();

    // Validate the single event response
    const validationResult = validatePolymarketEventSafe(data);
    
    if (validationResult.success) {
      // Convert DTO (strings) to server types (Dates)
      const convertedEvent = convertPolymarketEventDTOToServerType(validationResult.data);
      console.log(`Successfully fetched event ${eventId}: ${convertedEvent.title}`);
      return convertedEvent;
    } else {
      console.error(`Validation failed for event ${eventId}: ${validationResult.error}`);
      return null;
    }
  } catch (error) {
    console.error(`Failed to fetch event ${eventId}:`, error);
    return null;
  }
}
