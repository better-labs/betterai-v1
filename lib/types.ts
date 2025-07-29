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

export interface Event {
  id: string
  title: string
  category: string
  markets: Market[]
}

export interface PredictionResult {
  prediction: string
  confidence: number
  reasoning: string
  recommendedOutcome: string
  riskLevel: "Low" | "Medium" | "High"
  keyFactors?: string[]
  riskFactors?: string[]
}

export interface ThinkingState {
  isThinking: boolean
  message: string
  progress: number
}

export interface PolymarketApiResponse {
  markets: Market[]
}

// Raw Polymarket API types
export interface RawPolymarketMarket {
  id: string
  question: string
  description: string
  volume: string
  volumeNum: number
  liquidity: string
  liquidityNum: number
  outcomes: string // JSON string array like "[\"Yes\", \"No\"]"
  outcomePrices: string // JSON string array like "[\"0.65\", \"0.35\"]"
  endDate: string // ISO date string
  category: string
  slug: string
  active: boolean
  closed: boolean
  // ... many other fields we don't need
}

export type RawPolymarketApiResponse = RawPolymarketMarket[] 