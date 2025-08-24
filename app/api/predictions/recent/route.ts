import { NextResponse } from "next/server"
import { prisma } from '@/lib/db/prisma'
import * as predictionService from '@/lib/services/prediction-service'
import { requireAuth, createAuthErrorResponse } from "@/lib/auth"
import { serializeDecimals } from "@/lib/serialization"

export async function GET(request: Request) {
  try {
    // Require authentication for this endpoint
    const { userId } = await requireAuth(request)
    
    const { searchParams } = new URL(request.url)
    const limit = Math.max(1, Math.min(Number(searchParams.get('limit')) || 15, 50))
    const cursorParam = searchParams.get('cursor')
    const cursorId = cursorParam ? Number(cursorParam) : null
    
    // Check for tag filtering
    const tagIdsParam = searchParams.get('tagIds')
    const tagIds = tagIdsParam ? tagIdsParam.split(',').filter(Boolean) : null
    
    // Check for sort mode
    const sortMode = searchParams.get('sort') === 'predictions' ? 'predictions' : 'markets'

    let result
    if (tagIds && tagIds.length > 0) {
      // Filtered predictions by tags
      result = await predictionService.getRecentPredictionsWithRelationsFilteredByTags(prisma, tagIds, limit, cursorId ?? undefined, sortMode)
    } else {
      // All recent predictions
      result = await predictionService.getRecentPredictionsWithRelationsPaginated(prisma, limit, cursorId ?? undefined, sortMode)
    }

    const { items, nextCursor } = result

    return NextResponse.json({ 
      items: serializeDecimals(items),
      nextCursor,
      pageSize: limit,
      filteredByTags: tagIds || null,
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


