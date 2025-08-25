import { useEffect, useState } from 'react';
import { getFeatureFlags } from '@/lib/feature-flags';

/**
 * Custom hook to access feature flags in client components
 * Provides a consistent interface for checking feature flag states
 */
export function useFeatureFlags() {
  // Start with default values - true for development features to prevent flashing
  const [flags, setFlags] = useState({
    showMarketAlpha: true, // Show in development by default
    showPortfolio: true,   // Show in development by default  
    showSearch: true,      // Show in development by default
    showActivity: true,    // Show in development by default
    showTermsOfService: false,
    showPrivacyPolicy: false,
    showLoginSignup: true
  });

  useEffect(() => {
    // Update flags after client-side hydration
    setFlags(prevFlags => ({
      ...prevFlags,
      ...getFeatureFlags()
    }));
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