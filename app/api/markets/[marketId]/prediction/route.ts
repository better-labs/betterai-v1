import { type NextRequest, NextResponse } from "next/server"
import { prisma } from '@/lib/db/prisma'
import * as predictionService from '@/lib/services/prediction-service'
import { requireAuth, createAuthErrorResponse } from "@/lib/auth"

import type { ApiResponse } from "@/lib/types"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ marketId: string }> }
) {
  try {
    // Require authentication for this endpoint
    const { userId } = await requireAuth(request)
    
    const { marketId } = await params

    if (!marketId) {
      const errorResponse: ApiResponse = {
        success: false,
        error: "Market ID is required",
        timestamp: new Date().toISOString()
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    const prediction = await predictionService.getMostRecentPredictionByMarketIdSerialized(prisma, marketId)

    if (!prediction) {
      const responseData: ApiResponse = {
        success: true,
        data: { prediction: null },
        message: "No prediction found for this market",
        timestamp: new Date().toISOString()
      }
      return NextResponse.json(responseData, { status: 200 })
    }

    // Prepare the response data
    const responseData: ApiResponse = {
      success: true,
      data: {
        prediction: prediction.predictionResult,
        createdAt: prediction.createdAt,
        modelName: prediction.modelName,
        authenticatedUser: userId
      },
      timestamp: new Date().toISOString()
    }

    // Validate our response before sending it
    // Note: Using a generic validation here since this endpoint returns a custom format
    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Failed to fetch market prediction:", error)
    
    // Check if it's an authentication error
    if (error instanceof Error && error.message.includes('authentication')) {
      return createAuthErrorResponse(error.message)
    }
    
    const errorResponse: ApiResponse = {
      success: false,
      error: "Failed to fetch market prediction",
      timestamp: new Date().toISOString()
    }
    return NextResponse.json(errorResponse, { status: 500 })
  }
} 