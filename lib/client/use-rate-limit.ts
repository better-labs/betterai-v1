'use client';

import { useState, useCallback } from 'react';
import { extractRateLimitInfo, RateLimitInfo } from './rate-limit-utils';

interface RateLimitState {
  [endpoint: string]: RateLimitInfo;
}

export function useRateLimit() {
  const [rateLimits, setRateLimits] = useState<RateLimitState>({});

  // Update rate limit info from API response
  const updateFromResponse = useCallback((endpoint: string, response: Response) => {
    const info = extractRateLimitInfo(response);
    if (info) {
      setRateLimits(prev => ({
        ...prev,
        [endpoint]: info
      }));
    }
  }, []);

  // Get rate limit info for specific endpoint
  const getRateLimitInfo = useCallback((endpoint: string): RateLimitInfo | null => {
    return rateLimits[endpoint] || null;
  }, [rateLimits]);

  // Check if endpoint is rate limited
  const isRateLimited = useCallback((endpoint: string): boolean => {
    const info = rateLimits[endpoint];
    return info ? info.remaining === 0 && new Date() < info.resetTime : false;
  }, [rateLimits]);

  // Check if endpoint is near rate limit
  const isNearRateLimit = useCallback((endpoint: string, threshold = 3): boolean => {
    const info = rateLimits[endpoint];
    return info ? info.remaining <= threshold && info.remaining > 0 : false;
  }, [rateLimits]);

  // Clear rate limit for endpoint (useful when limit resets)
  const clearRateLimit = useCallback((endpoint: string) => {
    setRateLimits(prev => {
      const newState = { ...prev };
      delete newState[endpoint];
      return newState;
    });
  }, []);

  return {
    rateLimits,
    updateFromResponse,
    getRateLimitInfo,
    isRateLimited,
    isNearRateLimit,
    clearRateLimit
  };
}