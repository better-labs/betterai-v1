import { NextResponse } from "next/server"
import { Event, Market } from "@/lib/types"

export async function GET() {
  try {
    // Keep mock data for development, now structured as Events
    const mockEvents: Event[] = [
      {
        id: "event-1",
        title: "US Presidential Election 2024",
        category: "Politics",
        markets: [
          {
            id: "market-1a",
            question: "Will the Libertarian party win the popular vote?",
            description: "Market on the Libertarian party winning the popular vote.",
            volume: 2500000,
            liquidity: 1000000,
            outcomes: [
              { name: "Yes", price: 0.52 },
              { name: "No", price: 0.46 },
            ],
            endDate: "2024-11-05",
            category: "Politics",
            marketURL: "https://polymarket.com/event/us-presidential-election-2024",
          },
          {
            id: "market-1b",
            question: "Will the Democratic party win the popular vote?",
            description: "Market on the popular vote.",
            volume: 500000,
            liquidity: 200000,
            outcomes: [
              { name: "Yes", price: 0.60 },
              { name: "No", price: 0.40 },
            ],
            endDate: "2024-11-05",
            category: "Politics",
            marketURL: "https://polymarket.com/event/us-presidential-election-2024",
          },
        ]
      },
      {
        id: "event-2",
        title: "Bitcoin Price Speculation",
        category: "Crypto",
        markets: [
          {
            id: "market-2a",
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
            marketURL: "https://polymarket.com/event/bitcoin-price-speculation",
          },
        ]
      },
      {
        id: "event-3",
        title: "NBA Finals 2024",
        category: "Sports",
        markets: [
          {
            id: "market-3a",
            question: "Who will win the 2024 NBA Finals?",
            description: "Market on the winner of the NBA finals.",
            volume: 1200000,
            liquidity: 500000,
            outcomes: [
              { name: "Celtics", price: 0.75 },
              { name: "Mavericks", price: 0.25 },
            ],
            endDate: "2024-06-20",
            category: "Sports",
            marketURL: "https://polymarket.com/event/nba-finals-2024",
          },
        ],
      }
    ]
    return NextResponse.json({ events: mockEvents })

  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
  }
}
