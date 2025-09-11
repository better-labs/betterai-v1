// Research source configuration for enhanced market research system
// Phase 1: Exa.ai and Grok integration
// Future phases will add Google/Bing APIs

export interface ResearchSource {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly provider: string
  readonly creditCost: number
  readonly available: boolean
  readonly apiKey?: string // Environment variable name
  readonly features?: readonly string[]
}

export const RESEARCH_SOURCES: readonly ResearchSource[] = [
  {
    id: 'exa',
    name: 'Exa.ai',
    description: 'Advanced web search optimized for recent developments',
    provider: 'Exa.ai',
    creditCost: 1, // Higher cost for premium semantic search
    available: true,
    apiKey: 'EXA_API_KEY',
    features: ['semantic_search', 'news_focus', 'trusted_domains'] as const
  },
  {
    id: 'exa-two-step',
    name: 'Exa.ai Pro',
    description: 'Two-step Exa.ai search with enhanced content retrieval',
    provider: 'Exa.ai',
    creditCost: 2, // Higher cost for more robust two-step approach
    available: true,
    apiKey: 'EXA_API_KEY',
    features: ['semantic_search', 'full_content', 'error_resilience', 'content_optimization'] as const
  },
  {
    id: 'grok',
    name: 'X (Twitter)',
    description: 'X (Twitter) realtime market research via Grok AI',
    provider: 'Grok AI',
    creditCost: 2,
    available: true,
    apiKey: 'OPENROUTER_API_KEY', // Uses existing OpenRouter integration
    features: ['realtime_data', 'social_sentiment', 'viral_trends'] as const
  }
  // Phase 2 additions:
  // {
  //   id: 'google',
  //   name: 'Google Search API',
  //   description: 'Comprehensive web search with Google Search API',
  //   provider: 'Google',
  //   creditCost: 1,
  //   available: false, // Will be enabled in Phase 2
  //   apiKey: 'GOOGLE_SEARCH_API_KEY',
  //   features: ['web_search', 'news_search', 'image_search']
  // },
  // {
  //   id: 'bing',
  //   name: 'Bing Search API',
  //   description: 'Microsoft Bing search with news and web results',
  //   provider: 'Microsoft',
  //   creditCost: 1,
  //   available: false, // Will be enabled in Phase 2
  //   apiKey: 'BING_SEARCH_API_KEY',
  //   features: ['web_search', 'news_search', 'entity_search']
  // }
] as const

export type ResearchSourceId = 'exa' | 'exa-two-step' | 'grok' // Explicitly define the union type

// Helper functions for research source management
export function getResearchSource(id: string): ResearchSource | undefined {
  return RESEARCH_SOURCES.find(source => source.id === id)
}

export function getAvailableResearchSources(): readonly ResearchSource[] {
  return RESEARCH_SOURCES.filter(source => source.available)
}

export function getResearchSourceCost(id: string): number {
  const source = getResearchSource(id)
  return source?.creditCost || 0
}

export function isResearchSourceAvailable(id: string): boolean {
  const source = getResearchSource(id)
  return source?.available || false
}

export function validateResearchSourceId(id: string): id is ResearchSourceId {
  return RESEARCH_SOURCES.some(source => source.id === id)
}

// Cost calculation for multiple research sources (Phase 2+)
export function calculateResearchSourcesCost(sourceIds: string[]): number {
  return sourceIds.reduce((total, id) => total + getResearchSourceCost(id), 0)
}

// Environment variable validation
export function validateResearchSourceEnvironment(): {
  available: string[]
  missing: string[]
  errors: string[]
} {
  const available: string[] = []
  const missing: string[] = []
  const errors: string[] = []

  for (const source of RESEARCH_SOURCES) {
    if (!source.available) continue
    
    if (!source.apiKey) {
      errors.push(`Research source ${source.id} missing apiKey configuration`)
      continue
    }

    const envValue = process.env[source.apiKey]
    if (envValue && envValue.trim()) {
      available.push(source.id)
    } else {
      missing.push(`${source.apiKey} (for ${source.name})`)
    }
  }

  return { available, missing, errors }
}