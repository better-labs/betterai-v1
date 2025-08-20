import { useQuery } from '@tanstack/react-query';
import { fetchPolymarketEvents } from '@/lib/services/polymarket-client';
import type { PolymarketEvent } from '@/lib/types';

interface UsePolymarketEventsOptions {
  offset?: number;
  limit?: number;
  startDateMin?: Date | string;
  endDateMax?: Date | string;
  sortBy?: string;
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  refetchInterval?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
  userAgent?: string;
}

export function usePolymarketEvents(options: UsePolymarketEventsOptions = {}) {
  const {
    offset = 0,
    limit = 50,
    startDateMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDateMax = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    sortBy,
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    gcTime = 10 * 60 * 1000, // 10 minutes
    refetchInterval,
    maxRetries = 3,
    retryDelayMs = 2000,
    timeoutMs = 30000,
    userAgent = "BetterAI/1.0"
  } = options;

  const fetchOptions = {
    limit,
    maxRetries,
    retryDelayMs,
    timeoutMs,
    userAgent
  };

  return useQuery({
    queryKey: ['polymarket-events', { offset, limit, startDateMin, endDateMax, sortBy }],
    queryFn: () => fetchPolymarketEvents(
      offset,
      limit,
      startDateMin,
      endDateMax,
      fetchOptions,
      sortBy
    ),
    enabled,
    staleTime,
    gcTime,
    refetchInterval,
    retry: (failureCount, error) => {
      // Don't retry on rate limit errors (429)
      if (error instanceof Error && error.message.includes('429')) {
        return false;
      }
      return failureCount < maxRetries;
    },
    retryDelay: (attemptIndex) => Math.min(retryDelayMs * 2 ** attemptIndex, 30000),
  });
}