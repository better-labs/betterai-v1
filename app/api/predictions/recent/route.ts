import { NextResponse } from "next/server"
import { predictionQueries } from "@/lib/db/queries"
import { requireAuth, createAuthErrorResponse } from "@/lib/auth"

function serialize(value: any): any {
  if (value == null) return value
  if (Array.isArray(value)) return value.map(serialize)
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'object') {
    if (typeof (value as any)?.toNumber === 'function') {
      try { return Number((value as any).toNumber()) } catch {}
    }
    const out: Record<string, any> = {}
    for (const [k, v] of Object.entries(value)) out[k] = serialize(v)
    return out
  }
  return value
}

export async function GET(request: Request) {
  try {
    // Require authentication for this endpoint
    const { userId } = await requireAuth(request)
    
    const { searchParams } = new URL(request.url)
    const limit = Math.max(1, Math.min(Number(searchParams.get('limit')) || 12, 50))
    
    // Get predictions with user context (can be enhanced later for user-specific filtering)
    const items = await predictionQueries.getRecentPredictionsWithRelations(limit)
    
    return NextResponse.json({ 
      items: serialize(items),
      authenticatedUser: userId 
    })
  } catch (error) {
    console.error("GET /api/predictions/recent error", error)
    
    // Check if it's an authentication error
    if (error instanceof Error && error.message.includes('authentication')) {
      return createAuthErrorResponse(error.message)
    }
    
    return NextResponse.json({ error: "Failed to load predictions" }, { status: 500 })
  }
}


