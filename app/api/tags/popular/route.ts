import { NextRequest, NextResponse } from "next/server"
import { prisma } from '@/lib/db/prisma'
import * as tagService from '@/lib/services/tag-service'

// Memory-efficient cache for popular tags
type CachedTag = {
  id: string
  label: string
  slug: string | null
  forceShow: boolean | null
  providerUpdatedAt: Date | null
  provider: string | null
  totalVolume: number
}

type CacheEntry = {
  data: CachedTag[]
  timestamp: number
  limit: number
}

// Simple in-memory cache - uses <10KB memory for typical usage
const tagCache = new Map<string, CacheEntry>()
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes
const MAX_CACHE_ENTRIES = 5 // Limit cache size

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20) // Max 20 tags
    
    // Check cache first
    const cacheKey = `popular_tags_${limit}`
    const cached = tagCache.get(cacheKey)
    const now = Date.now()
    
    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        data: cached.data,
        timestamp: new Date(cached.timestamp).toISOString(),
        cached: true
      })
    }
    
    // Cache miss or expired - fetch from database
    const popularTags = await tagService.getPopularTagsByMarketVolume(prisma, limit)
    
    // Store in cache with memory management
    if (tagCache.size >= MAX_CACHE_ENTRIES) {
      // Remove oldest entry to prevent memory growth
      const oldestKey = tagCache.keys().next().value
      if (oldestKey) {
        tagCache.delete(oldestKey)
      }
    }
    
    tagCache.set(cacheKey, {
      data: popularTags,
      timestamp: now,
      limit
    })
    
    return NextResponse.json({
      success: true,
      data: popularTags,
      timestamp: new Date().toISOString(),
      cached: false
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