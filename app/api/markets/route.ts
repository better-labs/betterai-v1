import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import * as marketService from '@/lib/services/market-service'
import { mapMarketToDTO } from '@/lib/dtos'
import type { ApiResponse } from '@/lib/types'
import { checkRateLimit, getRateLimitIdentifier, createRateLimitResponse } from '@/lib/rate-limit'


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const eventId = searchParams.get('eventId')

    if (id) {
      const marketDto = await marketService.getMarketByIdSerialized(prisma, id)
      if (!marketDto) {
        const errorResponse: ApiResponse = {
          success: false,
          error: 'Market not found',
          timestamp: new Date().toISOString()
        }
        return new Response(
          JSON.stringify(errorResponse),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        )
      }
      
      const responseData: ApiResponse = {
        success: true,
        data: marketDto,
        timestamp: new Date().toISOString()
      }
      
      return new Response(
        JSON.stringify(responseData),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (eventId) {
      const marketDtos = await marketService.getMarketsByEventIdSerialized(prisma, eventId)
      const responseData: ApiResponse = {
        success: true,
        data: marketDtos,
        timestamp: new Date().toISOString()
      }
      return new Response(
        JSON.stringify(responseData),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Default: get all markets (using empty eventId filter)
    const marketDtos = await marketService.getMarketsByEventIdSerialized(prisma, '')
    const responseData: ApiResponse = {
      success: true,
      data: marketDtos,
      timestamp: new Date().toISOString()
    }
    return new Response(
      JSON.stringify(responseData),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Markets API error:', error)
    const errorResponse: ApiResponse = {
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }
    return new Response(
      JSON.stringify(errorResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const marketData = await request.json()
    const market = await marketService.createMarket(prisma, marketData)
    const marketDto = mapMarketToDTO(market)
    return new Response(
      JSON.stringify({ success: true, data: marketDto } as ApiResponse),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Create market error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to create market' } as ApiResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check rate limit for market write operations
    const identifier = await getRateLimitIdentifier(request)
    const rateLimitResult = await checkRateLimit('marketWrite', identifier)
    
    if (!rateLimitResult.success) {
      return createRateLimitResponse(
        rateLimitResult.remaining || 0,
        rateLimitResult.reset || new Date(Date.now() + 3600000)
      )
    }
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Market ID required' } as ApiResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const marketData = await request.json()
    const market = await marketService.updateMarket(prisma, id, marketData)
    
    if (!market) {
      return new Response(
        JSON.stringify({ success: false, error: 'Market not found' } as ApiResponse),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const marketDto = mapMarketToDTO(market)
    return new Response(
      JSON.stringify({ success: true, data: marketDto } as ApiResponse),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Update market error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to update market' } as ApiResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check rate limit for market write operations
    const identifier = await getRateLimitIdentifier(request)
    const rateLimitResult = await checkRateLimit('marketWrite', identifier)
    
    if (!rateLimitResult.success) {
      return createRateLimitResponse(
        rateLimitResult.remaining || 0,
        rateLimitResult.reset || new Date(Date.now() + 3600000)
      )
    }
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Market ID required' } as ApiResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const success = await marketService.deleteMarket(prisma, id)
    
    if (!success) {
      return new Response(
        JSON.stringify({ success: false, error: 'Market not found' } as ApiResponse),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Market deleted' } as ApiResponse),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Delete market error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to delete market' } as ApiResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
} 