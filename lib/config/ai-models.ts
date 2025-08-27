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
}

// Default model for predictions and research
export const DEFAULT_MODEL = 'openai/gpt-5-mini'

export const AI_MODELS: AIModel[] = [
  {
    id: 'anthropic/claude-sonnet-4',
    name: 'Claude Sonnet 4',
    provider: 'Anthropic',
    creditCost: 1,
    description: 'Advanced reasoning and analysis'
  },
  {
    id: 'x-ai/grok-3-mini',
    name: 'Grok 3 Mini',
    provider: 'xAI',
    creditCost: 1,
    description: 'Fast and efficient predictions'
  },
  {
    id: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    creditCost: 1,
    description: 'Quick and reliable predictions'
  },
  {
    id: 'deepseek/deepseek-chat-v3-0324',
    name: 'DeepSeek Chat v3',
    provider: 'DeepSeek',
    creditCost: 1,
    description: 'High-quality reasoning model'
  },
  {
    id: 'openai/gpt-5-mini',
    name: 'GPT-5 Mini',
    provider: 'OpenAI',
    creditCost: 1,
    description: 'Compact and efficient model'
  }
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