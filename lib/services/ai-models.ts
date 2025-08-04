// AI Model constants for the prediction service
export const AI_MODELS = {
  GPT_4: 'openai/gpt-4',
  GPT_4_TURBO: 'openai/gpt-4-turbo',
  GPT_3_5_TURBO: 'openai/gpt-3.5-turbo',
  CLAUDE_3_OPUS: 'anthropic/claude-3-opus',
  CLAUDE_3_SONNET: 'anthropic/claude-3-sonnet',
  CLAUDE_3_HAIKU: 'anthropic/claude-3-haiku',
  GEMINI_PRO: 'google/gemini-pro',
  MISTRAL_7B: 'mistralai/mistral-7b-instruct',
  MIXTRAL_8X7B: 'mistralai/mixtral-8x7b-instruct',
} as const

export const DEFAULT_MODELS = {
  FAST: AI_MODELS.GPT_3_5_TURBO,
  BALANCED: AI_MODELS.GPT_4_TURBO,
  HIGH_QUALITY: AI_MODELS.GPT_4,
  BEST: AI_MODELS.CLAUDE_3_OPUS,
} as const

export type AIModelName = typeof AI_MODELS[keyof typeof AI_MODELS]
export type DefaultModelName = typeof DEFAULT_MODELS[keyof typeof DEFAULT_MODELS] 