import { NextResponse } from "next/server"
import { getTrendingEventsWithMarkets } from "@/lib/data/events"

export async function GET() {
  try {
    const eventsWithMarkets = await getTrendingEventsWithMarkets()
    
    return NextResponse.json({ events: eventsWithMarkets })

  } catch (error) {
    console.error("Error fetching trending events:", error)
    return NextResponse.json({ error: "Failed to fetch trending events" }, { status: 500 })
  }
}
