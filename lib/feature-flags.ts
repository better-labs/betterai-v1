/**
 * Simple Feature Flags Configuration
 * 
 * These flags control page visibility across environments:
 * - Development: All pages visible by default
 * - Production: Restricted pages hidden unless explicitly enabled via environment variables
 */

export type FeatureFlag = {
  key: string;
  description: string;
  defaultValue: boolean;
  getValue: () => boolean;
};

// Helper function to check environment variables
const isEnabled = (envVar: string, defaultValue: boolean): boolean => {
  if (typeof window !== 'undefined') {
    // Client-side: use the default value based on environment
    return process.env.NODE_ENV === 'development' ? true : defaultValue;
  }
  
  // Server-side: check environment variable first, then fallback to default
  const envValue = process.env[envVar];
  if (envValue !== undefined) {
    return envValue === '1' || envValue === 'true';
  }
  
  return process.env.NODE_ENV === 'development' ? true : defaultValue;
};

// Page visibility flags - default to true for development, false for production
export const showMarketAlpha: FeatureFlag = {
  key: 'show-market-alpha',
  description: 'Show Market Alpha page',
  defaultValue: false,
  getValue: () => isEnabled('SHOW_MARKET_ALPHA', false)
};

export const showPortfolio: FeatureFlag = {
  key: 'show-portfolio', 
  description: 'Show Portfolio/My Portfolio page',
  defaultValue: false,
  getValue: () => isEnabled('SHOW_PORTFOLIO', false)
};

export const showSearch: FeatureFlag = {
  key: 'show-search',
  description: 'Show Search functionality',
  defaultValue: false,
  getValue: () => isEnabled('SHOW_SEARCH', false)
};

export const showActivity: FeatureFlag = {
  key: 'show-activity',
  description: 'Show Activity page',
  defaultValue: false,
  getValue: () => isEnabled('SHOW_ACTIVITY', false)
};

export const showTermsOfService: FeatureFlag = {
  key: 'show-tos',
  description: 'Show Terms of Service page',
  defaultValue: false,
  getValue: () => isEnabled('SHOW_TOS', false)
};

export const showPrivacyPolicy: FeatureFlag = {
  key: 'show-privacy',
  description: 'Show Privacy Policy page', 
  defaultValue: false,
  getValue: () => isEnabled('SHOW_PRIVACY', false)
};

// Convenience functions for easy usage
export const getFeatureFlags = () => ({
  showMarketAlpha: showMarketAlpha.getValue(),
  showPortfolio: showPortfolio.getValue(),
  showSearch: showSearch.getValue(),
  showActivity: showActivity.getValue(),
  showTermsOfService: showTermsOfService.getValue(),
  showPrivacyPolicy: showPrivacyPolicy.getValue()
});