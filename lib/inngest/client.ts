/**
 * Inngest Client Configuration
 * Single client used for both development and production
 */

import { Inngest } from 'inngest'

const isDev = process.env.NODE_ENV === 'development'
const useDevServer = process.env.INNGEST_DEV !== 'false' && isDev

// Create Inngest client with app identifier
// This ID should match your app name and be consistent across environments
export const inngest = new Inngest({ 
  id: 'betterai',
  name: 'BetterAI Prediction Engine',
  // Only use dev server if explicitly enabled
  ...(useDevServer && {
    devServerUrl: process.env.INNGEST_DEV_SERVER_URL || 'http://localhost:8288',
    devServerPort: 8288,
  }),
  // Force cloud mode in development to reduce local polling
  isDev: useDevServer,
  // Completely disable logging in development
  logger: isDev ? { info: () => {}, warn: () => {}, error: console.error, debug: () => {} } : console,
})