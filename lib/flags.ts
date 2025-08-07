import { flag } from 'flags';

export const showMarketAlphaPage = flag({
  key: 'show-market-alpha-page',
  decide: () => false, // Default to false, so it's hidden unless overridden
});

