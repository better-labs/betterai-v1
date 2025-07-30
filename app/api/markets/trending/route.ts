import { NextResponse } from "next/server"
import { Event, Market } from "@/lib/types"

export async function GET() {
  try {
    // Keep mock data for development, now structured as Events
    const mockEvents: Event[] = [
      {
        id: "event-1",
        title: "Fed Decision in July 2024",
        category: "Economy",
        markets: [
          {
            id: "market-1a",
            question: "Will the Fed decrease rates by 50+ bps in July?",
            description: "Market on Federal Reserve rate decision in July 2024.",
            volume: 124000000,
            liquidity: 50000000,
            outcomes: [
              { name: "Yes", price: 0.01 },
              { name: "No", price: 0.99 },
            ],
            endDate: "2024-07-31",
            category: "Economy",
            marketURL: "https://polymarket.com/event/fed-decision-july-2024",
          },
        ]
      },
      {
        id: "event-2",
        title: "Presidential Election Winner 2028",
        category: "Politics",
        markets: [
          {
            id: "market-2a",
            question: "Who will win the 2028 Presidential Election?",
            description: "Market on the 2028 presidential election winner.",
            volume: 3000000,
            liquidity: 1200000,
            outcomes: [
              { name: "JD Vance", price: 0.28 },
              { name: "Gavin Newsom", price: 0.14 },
              { name: "Alexandria Ocasio-Cortez", price: 0.11 },
            ],
            endDate: "2028-11-05",
            category: "Politics",
            marketURL: "https://polymarket.com/event/presidential-election-2028",
          },
        ]
      },
      {
        id: "event-3",
        title: "Jerome Powell Fed Chair Status",
        category: "Economy",
        markets: [
          {
            id: "market-3a",
            question: "Will Jerome Powell be out as Fed Chair in 2025?",
            description: "Market on Jerome Powell's tenure as Fed Chair.",
            volume: 7000000,
            liquidity: 2800000,
            outcomes: [
              { name: "Yes", price: 0.17 },
              { name: "No", price: 0.83 },
            ],
            endDate: "2025-12-31",
            category: "Economy",
            marketURL: "https://polymarket.com/event/jerome-powell-fed-chair-2025",
          },
        ]
      },
      {
        id: "event-4",
        title: "New York City Mayoral Election",
        category: "Politics",
        markets: [
          {
            id: "market-4a",
            question: "Who will win the NYC Mayoral Election?",
            description: "Market on the New York City mayoral election.",
            volume: 39000000,
            liquidity: 15000000,
            outcomes: [
              { name: "Zohran Mamdani", price: 0.78 },
              { name: "Eric Adams", price: 0.09 },
              { name: "Andrew Cuomo", price: 0.00 },
            ],
            endDate: "2024-11-05",
            category: "Politics",
            marketURL: "https://polymarket.com/event/nyc-mayoral-election",
          },
        ]
      },
      {
        id: "event-5",
        title: "Israel-Hamas Ceasefire",
        category: "World",
        markets: [
          {
            id: "market-5a",
            question: "Will Israel and Hamas reach a ceasefire by August 15?",
            description: "Market on Israel-Hamas ceasefire agreement.",
            volume: 3000000,
            liquidity: 1200000,
            outcomes: [
              { name: "Yes", price: 0.18 },
              { name: "No", price: 0.82 },
            ],
            endDate: "2024-08-15",
            category: "World",
            marketURL: "https://polymarket.com/event/israel-hamas-ceasefire",
          },
        ]
      },
      {
        id: "event-6",
        title: "Powell Press Conference July",
        category: "Economy",
        markets: [
          {
            id: "market-6a",
            question: "What will Powell say during July Press Conference?",
            description: "Market on Jerome Powell's July press conference statements.",
            volume: 344000,
            liquidity: 137600,
            outcomes: [
              { name: "Inflation 40+ times", price: 0.77 },
              { name: "Inflation 50+ times", price: 0.49 },
              { name: "Inflation 60+ times", price: 0.10 },
            ],
            endDate: "2024-07-31",
            category: "Economy",
            marketURL: "https://polymarket.com/event/powell-press-conference-july",
          },
        ]
      },
      {
        id: "event-7",
        title: "Trump Pardon Ghislaine Maxwell",
        category: "Politics",
        markets: [
          {
            id: "market-7a",
            question: "Will Trump pardon Ghislaine Maxwell by end of 2024?",
            description: "Market on Trump's potential pardon of Ghislaine Maxwell.",
            volume: 126000,
            liquidity: 50400,
            outcomes: [
              { name: "Yes", price: 0.22 },
              { name: "No", price: 0.78 },
            ],
            endDate: "2024-12-31",
            category: "Politics",
            marketURL: "https://polymarket.com/event/trump-pardon-maxwell",
          },
        ]
      },
      {
        id: "event-8",
        title: "GPT-5 Release Date",
        category: "Tech",
        markets: [
          {
            id: "market-8a",
            question: "When will GPT-5 be released?",
            description: "Market on OpenAI's GPT-5 release date.",
            volume: 2000000,
            liquidity: 800000,
            outcomes: [
              { name: "July 31", price: 0.03 },
              { name: "August 15", price: 0.73 },
              { name: "August 31", price: 0.00 },
            ],
            endDate: "2024-08-31",
            category: "Tech",
            marketURL: "https://polymarket.com/event/gpt-5-release-date",
          },
        ]
      },
      {
        id: "event-9",
        title: "Trump 2025 Pardons",
        category: "Politics",
        markets: [
          {
            id: "market-9a",
            question: "Who will Trump pardon in 2025?",
            description: "Market on Trump's potential pardons in 2025.",
            volume: 876000,
            liquidity: 350400,
            outcomes: [
              { name: "Changpeng Zhao", price: 0.30 },
              { name: "Diddy", price: 0.20 },
              { name: "Ghislaine Maxwell", price: 0.16 },
            ],
            endDate: "2025-12-31",
            category: "Politics",
            marketURL: "https://polymarket.com/event/trump-2025-pardons",
          },
        ]
      },
      {
        id: "event-10",
        title: "US Tariff Agreements",
        category: "Economy",
        markets: [
          {
            id: "market-10a",
            question: "Which countries will the US agree to tariff agreements with?",
            description: "Market on US tariff agreements with various countries.",
            volume: 1000000,
            liquidity: 400000,
            outcomes: [
              { name: "China", price: 0.53 },
              { name: "India", price: 0.08 },
              { name: "Canada", price: 0.10 },
            ],
            endDate: "2024-12-31",
            category: "Economy",
            marketURL: "https://polymarket.com/event/us-tariff-agreements",
          },
        ]
      }
    ]
    return NextResponse.json({ events: mockEvents })

  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
  }
}
