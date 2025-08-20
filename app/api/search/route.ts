import { NextRequest } from 'next/server'
import { searchQueries } from '@/lib/db/queries'
import type { ApiResponse } from '@/lib/types'
import { checkRateLimit, getRateLimitIdentifier, createRateLimitResponse } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  try {
    // Rate limiting for search operations
    const identifier = await getRateLimitIdentifier(request)
    const rateLimitResult = await checkRateLimit('search', identifier)
    
    if (!rateLimitResult.success) {
      return createRateLimitResponse(
        rateLimitResult.remaining || 0,
        rateLimitResult.reset || new Date(Date.now() + 3600000)
      )
    }

    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim()
    const type = searchParams.get('type') // 'all', 'markets', 'events', 'tags'
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
    
    // Market-specific filters
    const sort = searchParams.get('sort') as 'trending' | 'liquidity' | 'volume' | 'newest' | 'ending' | 'competitive' | null
    const status = searchParams.get('status') as 'active' | 'resolved' | 'all' | null
    const cursor = searchParams.get('cursor')

    if (!q || q.length < 1) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: { 
            markets: [], 
            events: [], 
            tags: [], 
            totalResults: 0,
            suggestions: []
          } 
        } as ApiResponse),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Determine what to search based on type parameter
    const includeMarkets = type === 'all' || type === 'markets' || !type
    const includeEvents = type === 'all' || type === 'events' || !type
    const includeTags = type === 'all' || type === 'tags' || !type

    // Search with unified query
    const results = await searchQueries.searchAll(q, {
      includeMarkets,
      includeEvents,
      includeTags,
      limit,
      marketOptions: {
        sort: sort || 'trending',
        status: status || 'active',
        cursorId: cursor,
        limit
      }
    })

    return new Response(
      JSON.stringify({ success: true, data: results } as ApiResponse),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Search API error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' } as ApiResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}