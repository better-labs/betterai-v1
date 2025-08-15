import { NextRequest, NextResponse } from "next/server"
import { tagQueries } from "@/lib/db/queries"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20) // Max 20 tags
    
    const popularTags = await tagQueries.getPopularTagsByMarketVolume(limit)
    
    return NextResponse.json({
      success: true,
      data: popularTags,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("Error fetching popular tags:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch popular tags",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}