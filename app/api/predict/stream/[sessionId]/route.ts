import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/services/generate-user-prediction'

interface RouteParams {
  params: {
    sessionId: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { sessionId } = params
  
  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
  }

  // Set up SSE headers
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  })

  // Create a ReadableStream for SSE
  const stream = new ReadableStream({
    start(controller) {
      const sendEvent = (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`
        controller.enqueue(new TextEncoder().encode(message))
      }

      const checkProgress = () => {
        const session = getSession(sessionId)
        
        if (!session) {
          sendEvent({ 
            type: 'error', 
            message: 'Session not found',
            sessionId 
          })
          controller.close()
          return
        }

        // Send current progress
        sendEvent({
          type: 'progress',
          sessionId: session.id,
          status: session.status,
          progress: session.progress,
          currentStep: session.currentStep,
          completedModels: session.completedModels,
          totalModels: session.selectedModels.length,
          results: session.results,
          error: session.error
        })

        // If completed or error, close the connection
        if (session.status === 'completed' || session.status === 'error') {
          sendEvent({ 
            type: 'complete',
            sessionId: session.id,
            status: session.status,
            results: session.results,
            error: session.error
          })
          controller.close()
          return
        }

        // Continue checking progress
        setTimeout(checkProgress, 1000) // Check every second
      }

      // Send initial connection confirmation
      sendEvent({ 
        type: 'connected', 
        sessionId,
        timestamp: new Date().toISOString()
      })

      // Start checking progress
      checkProgress()
    },

    cancel() {
      // Cleanup when client disconnects
      console.log(`SSE connection closed for session: ${sessionId}`)
    }
  })

  return new Response(stream, { headers })
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}