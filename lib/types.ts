/**
 * Application-specific TypeScript types and interfaces.
 * Contains type definitions that are used in the application but don't directly map to database models.
 * These types are used for UI state management, API responses, and other application-specific data structures.
 */
export interface ThinkingState {
  isThinking: boolean
  message: string
  progress: number
}

// Raw Polymarket API types (external API responses)
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
  slug: string
  active: boolean
  closed: boolean
  // ... many other fields we don't need
}

export type RawPolymarketApiResponse = RawPolymarketMarket[] 

// Polymarket API types (before database transformation)
export interface PolymarketEvent {
  id: string;
  title: string;
  description: string;
  slug: string;
  icon: string;
  tags: Array<{
    id: string;
    label: string;
    slug: string;
    forceShow: boolean;
    updatedAt: string;
  }>;
  volume: number;
  startDate?: Date | null;
  endDate?: Date | null;
  markets: PolymarketMarket[];
}

export interface PolymarketMarket {
  id: string;
  question: string;
  description?: string;
  slug?: string;
  outcomePrices: string; // JSON string
  outcomes?: string; // JSON string array like "[\"Yes\", \"No\"]"
  volume: string;
  liquidity: string;
  active?: boolean;
  closed?: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
  resolutionSource?: string;
  eventId?: string; // Added by us during processing
}

// Extended types for API responses (UI/API specific)
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
  volume?: string | null;
  trendingRank?: number | null;
  endDate?: Date | null;
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
}

export interface DatabaseMetadata {
  database: "neon"
  orm: "drizzle"
  timestamp: string
  requestId: string
}

// Re-export all database types from schema for convenience
export type { 
  Event, 
  NewEvent, 
  Market, 
  NewMarket,
  Prediction, 
  NewPrediction, 
  AIModel, 
  NewAIModel 
} from "./db/schema" 

