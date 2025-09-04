/**
 * AI Model Configuration
 * Central definition of available models with credit costs and metadata
 */

export interface AIModel {
  id: string
  name: string
  provider: string
  creditCost: number
  description: string
  internalCostPerMOutputTokens: number
}

// Default model for predictions and research
export const DEFAULT_MODEL = 'openai/gpt-5-mini'

// Note: 1 credit equals approx $0.5/M output tokens

export const AI_MODELS: AIModel[] = [
  {
    id: 'openai/gpt-5',
    name: 'ChatGPT 5',
    provider: 'OpenAI',
    creditCost: 10,
    description: 'Latest OpenAI model with cutting-edge reasoning',
    internalCostPerMOutputTokens: 10
  },
  {
    id: 'openai/gpt-5-mini',
    name: 'Chat GPT 5 Mini',
    provider: 'OpenAI',
    creditCost: 2,
    description: 'Fast and low cost predictions from OpenAI',
    internalCostPerMOutputTokens: 2
  },
  {
    id: 'google/gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    creditCost: 10,
    description: 'Latest Google model with cutting-edge reasoning',
    internalCostPerMOutputTokens: 10
  },
  {
    id: 'x-ai/grok-4',
    name: 'Grok 4',
    provider: 'xAI',
    creditCost: 15,
    description: 'Latest xAI model with cutting-edge reasoning and access to the latest news from X (Twitter)',
    internalCostPerMOutputTokens: 15
  },
  {
    id: 'anthropic/claude-sonnet-4',
    name: 'Claude Sonnet 4',
    provider: 'Anthropic',
    creditCost: 15,
    description: 'Latest middle grade model from Anthropic with advanced reasoning',
    internalCostPerMOutputTokens: 15
  },
  
]

/**
 * Get all available models
 */
export const getAvailableModels = (): AIModel[] => AI_MODELS

/**
 * Get model by ID
 */
export const getModelById = (id: string): AIModel | undefined => 
  AI_MODELS.find(model => model.id === id)

/**
 * Get all model IDs (for legacy compatibility)
 */
export const getModelIds = (): string[] => 
  AI_MODELS.map(model => model.id)

/**
 * Calculate total credit cost for selected models
 */
export const calculateTotalCreditCost = (modelIds: string[]): number => 
  modelIds.reduce((total, id) => {
    const model = getModelById(id)
    return total + (model?.creditCost || 0)
  }, 0)

/**
 * Validate model IDs exist in our configuration
 */
export const validateModelIds = (modelIds: string[]): { valid: string[]; invalid: string[] } => {
  const valid: string[] = []
  const invalid: string[] = []
  
  modelIds.forEach(id => {
    if (getModelById(id)) {
      valid.push(id)
    } else {
      invalid.push(id)
    }
  })
  
  return { valid, invalid }
}