import { NextRequest } from 'next/server'
import { updateAIModels } from '@/lib/data/ai-models'
import type { ApiResponse } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from a trusted source (cron job)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' } as ApiResponse),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log('Starting AI models update...')
    await updateAIModels()
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'AI models updated successfully'
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

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from a trusted source (cron job)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' } as ApiResponse),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log('Starting AI models update...')
    await updateAIModels()
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'AI models updated successfully'
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