import { NextResponse } from "next/server"

export async function GET() {
  try {
    // In production, this would call the actual Polymarket API
    // const response = await fetch('https://gamma-api.polymarket.com/markets?limit=10&order=volume24hr')
    // const data = await response.json()

    // Mock response for demo
    const mockMarkets = [
      {
        id: "1",
        question: "Will Bitcoin reach $100,000 by end of 2024?",
        description: "Bitcoin price prediction market",
        volume: 125000,
        liquidity: 45000,
        outcomes: [
          { name: "Yes", price: 0.65 },
          { name: "No", price: 0.35 },
        ],
        endDate: "2024-12-31",
        category: "Crypto",
      },
      {
        id: "2",
        question: "Will the Lakers make the NBA playoffs?",
        description: "NBA playoffs prediction",
        volume: 89000,
        liquidity: 32000,
        outcomes: [
          { name: "Yes", price: 0.72 },
          { name: "No", price: 0.28 },
        ],
        endDate: "2024-04-15",
        category: "Sports",
      },
      // ... more markets
    ]

    return NextResponse.json({ markets: mockMarkets })
  } catch (error) {
    console.error("Error fetching markets:", error)
    return NextResponse.json({ error: "Failed to fetch markets" }, { status: 500 })
  }
}
