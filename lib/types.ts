export interface MarketOutcome {
  name: string
  price: number
}

// Legacy interfaces - kept for backward compatibility
// Use schema types (Event, Market) for database operations
export interface LegacyMarket {
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

export interface LegacyEvent {
  id: string
  title: string
  category: string
  markets: LegacyMarket[]
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
  markets: LegacyMarket[]
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

// Export all types from schema for convenience
export type { Event, NewEvent, Market, NewMarket, Prediction, NewPrediction } from "./db/schema"

// Extended types for API responses
export interface EventWithMarkets extends Event {
  markets: import("./db/schema").Market[]
  category?: string // Optional category for display purposes
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp?: string
}

export interface PredictionResult {
  prediction: string
  probability: number
  reasoning: string
  confidence_level: "High" | "Medium" | "Low"
  key_factors: string[]
  timeframe: string
  risks: string[]
  methodology?: string
}

export interface DatabaseMetadata {
  database: "neon"
  orm: "drizzle"
  timestamp: string
  requestId: string
}

export interface PolymarketEvent {
  id: string;
  title: string;
  description: string;
  slug: string;
  icon: string; // Add icon URL field
  tags: Array<{
    id: string;
    label: string;
    slug: string;
    forceShow: boolean;
    updatedAt: string;
  }>;
  endDate: string;
  volume: number;
  markets: PolymarketMarket[];
}

export interface PolymarketMarket {
  id: string;
  question: string;
  outcomePrices: string; // JSON string
  volume: string;
  liquidity: string;
  eventId?: string; // Added by us during processing
} 

