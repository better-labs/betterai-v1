import { NextRequest } from 'next/server'
import { aiModelQueries } from '@/lib/db/queries'
import type { ApiResponse } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id) {
      // Get specific AI model by ID
      const model = await aiModelQueries.getAIModelById(id)
      if (!model) {
        return new Response(
          JSON.stringify({ success: false, error: 'AI model not found' } as ApiResponse),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        )
      }
      return new Response(
        JSON.stringify({
          success: true,
          data: model
        } as ApiResponse),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get all AI models
    const models = await aiModelQueries.getAllAIModels()
    return new Response(
      JSON.stringify({
        success: true,
        data: models
      } as ApiResponse),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Get AI models error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to get AI models' } as ApiResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
} 