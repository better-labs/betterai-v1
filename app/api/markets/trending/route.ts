import { NextResponse } from "next/server"
import { prisma } from '@/lib/db/prisma'
import * as eventService from '@/lib/services/event-service'

export async function GET() {
  try {
    const eventsWithMarkets = await eventService.getTrendingEventsWithMarkets(prisma)
    
    return NextResponse.json({ events: eventsWithMarkets })

  } catch (error) {
    console.error("Error fetching trending events:", error)
    return NextResponse.json({ error: "Failed to fetch trending events" }, { status: 500 })
  }
}
