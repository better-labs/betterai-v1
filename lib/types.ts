export interface MarketOutcome {
  name: string
  price: number
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
  outcomePrices: string // JSON string array like "[\"0.35\", \"0.65\"]"
  endTime: string // ISO date string
  slug: string
  active: boolean
  closed: boolean
  // ... many other fields we don't need
}

export type RawPolymarketApiResponse = RawPolymarketMarket[] 

// Export all types from schema for convenience
export type { Event, NewEvent, Prediction, NewPrediction } from "./db/schema"

// Re-export NewMarket for compatibility
export type NewMarket = {
  question: string;
  description?: string;
  eventId?: string | null;
  outcomePrices?: string[] | null;
  volume?: string | null;
  liquidity?: string | null;
  endTime?: string | null;
  marketURL?: string;
  outcomes?: MarketOutcome[];
}

// Extended Market type with additional fields
export interface Market {
  id: string;
  question: string;
  description?: string;
  eventId?: string | null;
  outcomePrices?: string[] | null;
  volume?: string | null;
  liquidity?: string | null;
  updatedAt?: Date | null;
  endTime?: string | null;
  marketURL?: string;
  outcomes?: MarketOutcome[];
}

// Extended types for API responses
export interface EventWithMarkets {
  id: string;
  title: string;
  description?: string | null;
  slug?: string | null;
  icon?: string | null;
  tags?: Array<{
    id: string;
    label: string;
    slug: string;
    forceShow?: boolean;
    updatedAt?: string;
  }> | null;
  endTime?: Date | null;
  volume?: string | null;
  trendingRank?: number | null;
  updatedAt?: Date | null;
  markets: import("./db/schema").Market[];
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
  endTime: string;
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

