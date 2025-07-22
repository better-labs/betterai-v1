import { getTopPolyMarkets } from "@/lib/polymarket";
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Get real Polymarket data
    const realtimeMarkets = await getTopPolyMarkets();
    return NextResponse.json({ markets: realtimeMarkets })

    // Keep mock data as fallback comment for development
    /* 
    const mockMarkets = [
      {
        id: "1",
        question: "Will Bitcoin reach $100,000 by end of 2024?",
        description: "Bitcoin price prediction market",
        volume: 125000,
        
        outcomes: [
          { name: "Yes", price: 0.65 },
          { name: "No", price: 0.35 },
        ],
        endDate: "2024-12-31",
        category: "Crypto",
        marketURL: "www.somemarket.com/1234",
      },
      {
        id: "2",
        question: "Will the Lakers make the NBA playoffs?",
        description: "NBA playoffs prediction",
        volume: 89000,
        
        outcomes: [
          { name: "Yes", price: 0.72 },
          { name: "No", price: 0.28 },
        ],
        endDate: "2024-04-15",
        category: "Sports",
        marketURL: "www.somemarket.com/1234",
      },
    ]
    return NextResponse.json({ markets: mockMarkets })
    */

  } catch (error) {
    console.error("Error fetching markets:", error)
    return NextResponse.json({ error: "Failed to fetch markets" }, { status: 500 })
  }
}
