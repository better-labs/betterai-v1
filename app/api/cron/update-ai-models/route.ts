import { NextRequest } from 'next/server'
import { updateAIModels } from '@/lib/services/ai-models'
import type { ApiResponse } from '@/lib/types'
import { requireCronAuth } from '@/lib/auth/cron-auth'

export const maxDuration = 300

export async function GET(request: NextRequest) {
  try {
    // Security: Authenticate the request
    const authResponse = requireCronAuth(request)
    if (authResponse) {
      return authResponse
    }

    console.log('Starting AI models update...')
    const result = await updateAIModels()
    
    if (!result.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: result.error || 'Failed to update AI models'
        } as ApiResponse),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `AI models updated successfully. Fetched: ${result.totalFetched}, Upserted: ${result.totalUpserted}`
      } as ApiResponse),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Update AI models error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to update AI models'
      } as ApiResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
} 