import { useEffect, useState } from 'react';
import { getFeatureFlags } from '@/lib/feature-flags';

/**
 * Custom hook to access feature flags in client components
 * Provides a consistent interface for checking feature flag states
 */
export function useFeatureFlags() {
  // Start with default false values to prevent hydration mismatch
  const [flags, setFlags] = useState({
    showMarketAlpha: false,
    showPortfolio: false,
    showSearch: false,
    showActivity: false,
    showTermsOfService: false,
    showPrivacyPolicy: false
  });

  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Mark as hydrated and update flags after client-side hydration
    setIsHydrated(true);
    setFlags(getFeatureFlags());
  }, []);

  return flags;
}

/**
 * Server-side function to check feature flags
 * Use this in server components and API routes
 */
export function getServerFeatureFlags() {
  return getFeatureFlags();
}