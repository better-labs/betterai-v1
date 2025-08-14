import { NextResponse } from "next/server"
import { predictionQueries } from "@/lib/db/queries"

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
    const { searchParams } = new URL(request.url)
    const limit = Math.max(1, Math.min(Number(searchParams.get('limit')) || 12, 50))
    const items = await predictionQueries.getRecentPredictionsWithRelations(limit)
    return NextResponse.json({ items: serialize(items) })
  } catch (error) {
    console.error("GET /api/predictions/recent error", error)
    return NextResponse.json({ error: "Failed to load predictions" }, { status: 500 })
  }
}


