export interface MarketOutcome {
  name: string
  price: number
}

export interface Market {
  id: string
  question: string
  description: string
  volume: number
  liquidity: number
  outcomes: MarketOutcome[]
  endDate: string
  category: string
  marketURL: string
}

export interface PolymarketApiResponse {
  markets: Market[]
} 