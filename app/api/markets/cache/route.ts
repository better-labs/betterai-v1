import { cacheUtils } from "@/lib/polymarket";
import { NextRequest, NextResponse } from "next/server";

// GET /api/markets/cache - Get cache statistics
export async function GET() {
  try {
    const stats = cacheUtils.getCacheStats();
    
    // Add more detailed info for each cache entry
    const detailedStats = {
      ...stats,
      entries: stats.keys.map(key => {
        const limit = parseInt(key.replace('polymarket_markets_', ''));
        return {
          key,
          limit,
          isCached: cacheUtils.isCached(limit),
          timeUntilExpiry: cacheUtils.getTimeUntilExpiry(limit)
        };
      })
    };

    return NextResponse.json({
      success: true,
      cache: detailedStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error getting cache stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get cache stats" },
      { status: 500 }
    );
  }
}

// DELETE /api/markets/cache - Clear all cache
export async function DELETE() {
  try {
    cacheUtils.clearCache();
    
    return NextResponse.json({
      success: true,
      message: "Cache cleared successfully",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error clearing cache:", error);
    return NextResponse.json(
      { success: false, error: "Failed to clear cache" },
      { status: 500 }
    );
  }
}

// POST /api/markets/cache/clear - Alternative clear cache endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    
    if (body.action === 'clear') {
      cacheUtils.clearCache();
      
      return NextResponse.json({
        success: true,
        message: "Cache cleared successfully",
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json(
      { success: false, error: "Invalid action. Use { \"action\": \"clear\" }" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error processing cache action:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process cache action" },
      { status: 500 }
    );
  }
} 