/**
 * AI Model Constants
 * 
 * This file contains constants for AI model identifiers used throughout the application.
 * These constants help maintain consistency and make it easier to update model references.
 */

// OpenAI Models
export const OPENAI_MODELS = {
  GPT_4O_MINI: 'openai/gpt-4o-mini',
  GPT_4_1: 'openai/gpt-4.1',
  HORIZON_BETA: 'openrouter/horizon-beta',
} as const;

// Anthropic Models
export const ANTHROPIC_MODELS = {
  CLAUDE_SONNET_4: 'anthropic/claude-sonnet-4',
  CLAUDE_3_7_SONNET: 'anthropic/claude-3.7-sonnet',
} as const;

// Google Models
export const GOOGLE_MODELS = {
  GEMINI_2_5_FLASH: 'google/gemini-2.5-flash',
  GEMINI_2_5_FLASH_LITE: 'google/gemini-2.5-flash-lite',
  GEMINI_2_5_PRO: 'google/gemini-2.5-pro',
} as const;

// Grok Models
export const GROK_MODELS = {
  GROK_4: 'x-ai/grok-4',
  GROK_3_MINI: 'x-ai/grok-3-mini',
} as const;

// Qwen Models
export const QWEN_MODELS = {
  QWEN_3_CODER: 'qwen/qwen3-coder',
} as const;

// Default model selections
export const DEFAULT_MODELS = {
  PRIMARY: GOOGLE_MODELS.GEMINI_2_5_FLASH_LITE,
  FAST: GOOGLE_MODELS.GEMINI_2_5_FLASH_LITE,
} as const;

// Model companies for UI/configuration
export const MODEL_COMPANY = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  GOOGLE: 'google',
  GROK: 'grok',
  QWEN: 'qwen',
} as const;

// Type definitions for type safety
export type OpenAIModel = typeof OPENAI_MODELS[keyof typeof OPENAI_MODELS];
export type AnthropicModel = typeof ANTHROPIC_MODELS[keyof typeof ANTHROPIC_MODELS];
export type GoogleModel = typeof GOOGLE_MODELS[keyof typeof GOOGLE_MODELS];
export type GrokModel = typeof GROK_MODELS[keyof typeof GROK_MODELS];
export type QwenModel = typeof QWEN_MODELS[keyof typeof QWEN_MODELS];
export type AIModel = OpenAIModel | AnthropicModel | GoogleModel | GrokModel | QwenModel;
export type ModelCompany = typeof MODEL_COMPANY[keyof typeof MODEL_COMPANY]; 