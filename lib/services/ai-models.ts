import { upsertAIModels } from '@/lib/data/ai-models'
import type { NewAIModel } from '@/lib/types'

export interface AIModelsUpdateStats {
  totalFetched: number
  totalUpserted: number
  success: boolean
  error?: string
}

export async function updateAIModels(): Promise<AIModelsUpdateStats> {
  try {
    console.log('Fetching AI models from OpenRouter API...')
    
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'BetterAI/1.0',
      },
    })

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    if (!data.data || !Array.isArray(data.data)) {
      throw new Error('Invalid response format from OpenRouter API')
    }

    console.log(`Fetched ${data.data.length} models from OpenRouter API`)

    // Transform the data to match our schema
    const modelsToUpsert: NewAIModel[] = data.data.map((model: any) => ({
      id: model.id,
      name: model.name,
      created: model.created,
      description: model.description,
      architecture: model.architecture,
      topProvider: model.top_provider,
      pricing: model.pricing,
      canonicalSlug: model.canonical_slug,
      contextLength: model.context_length,
      huggingFaceId: model.hugging_face_id,
      perRequestLimits: model.per_request_limits,
      supportedParameters: model.supported_parameters,
      updatedAt: new Date(),
    }))

    console.log(`Upserting ${modelsToUpsert.length} AI models...`)
    const insertedModels = await upsertAIModels(modelsToUpsert)
    
    console.log(`Successfully updated ${insertedModels.length} AI models`)
    
    return {
      totalFetched: data.data.length,
      totalUpserted: insertedModels.length,
      success: true
    }
  } catch (error) {
    console.error('Error updating AI models:', error)
    return {
      totalFetched: 0,
      totalUpserted: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
} 