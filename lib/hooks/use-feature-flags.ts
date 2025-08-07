import { useEffect, useState } from 'react';
import { getFeatureFlags } from '@/lib/feature-flags';

/**
 * Custom hook to access feature flags in client components
 * Provides a consistent interface for checking feature flag states
 */
export function useFeatureFlags() {
  const [flags, setFlags] = useState(() => getFeatureFlags());

  useEffect(() => {
    // Update flags state on mount to ensure consistency
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