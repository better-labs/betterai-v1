/**
 * AI Model Constants
 * 
 * This file contains constants for AI model identifiers used throughout the application.
 * These constants help maintain consistency and make it easier to update model references.
 */

// All AI Models consolidated
export const AI_MODELS = {
  // OpenAI Models
  OPENAI_GPT_4O_MINI: 'openai/gpt-4o-mini',
  OPENAI_GPT_4_1: 'openai/gpt-4.1',
  OPENROUTER_HORIZON_BETA: 'openrouter/horizon-beta',
  
  // Anthropic Models
  ANTHROPIC_CLAUDE_SONNET_4: 'anthropic/claude-sonnet-4',
  ANTHROPIC_CLAUDE_3_7_SONNET: 'anthropic/claude-3.7-sonnet',
  
  // Google Models
  GOOGLE_GEMINI_2_5_FLASH: 'google/gemini-2.5-flash',
  GOOGLE_GEMINI_2_5_FLASH_LITE: 'google/gemini-2.5-flash-lite',
  GOOGLE_GEMINI_2_5_PRO: 'google/gemini-2.5-pro',
  
  // Grok Models
  XAI_GROK_4: 'x-ai/grok-4',
  XAI_GROK_3_MINI: 'x-ai/grok-3-mini',
  
  // Qwen Models
  QWEN_QWEN3_CODER: 'qwen/qwen3-coder',
} as const;

// Model companies for UI/configuration
export const MODEL_COMPANY = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  GOOGLE: 'google',
  GROK: 'grok',
  QWEN: 'qwen',
} as const;


// Default model selections
export const DEFAULT_MODELS = {
  FAST: AI_MODELS.GOOGLE_GEMINI_2_5_FLASH_LITE,
  PREMIUM: AI_MODELS.GOOGLE_GEMINI_2_5_PRO,
} as const;

// Type definitions for type safety
export type AIModel = typeof AI_MODELS[keyof typeof AI_MODELS];
export type ModelCompany = typeof MODEL_COMPANY[keyof typeof MODEL_COMPANY]; 