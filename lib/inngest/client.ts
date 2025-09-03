/**
 * Inngest Client Configuration
 * Single client used for both development and production
 */

import { Inngest } from 'inngest'

// Create Inngest client with app identifier
// This ID should match your app name and be consistent across environments
export const inngest = new Inngest({ 
  id: 'betterai',
  name: 'BetterAI Prediction Engine'
})