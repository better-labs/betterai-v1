/**
 * Application-specific TypeScript types and interfaces.
 * Contains type definitions that are used in the application but don't directly map to database models.
 * These types are used for UI state management, API responses, and other application-specific data structures.
 */

// Server-side types (with Date objects)
export interface CreditBalanceServer {
  credits: number
  creditsLastReset: Date
  totalCreditsEarned: number
  totalCreditsSpent: number
}

// Client-side types (with serialized dates as strings)
export interface CreditBalanceClient {
  credits: number
  creditsLastReset: string // ISO string from JSON
  totalCreditsEarned: number
  totalCreditsSpent: number
}

// API Response types
export interface CreditsApiResponse {
  credits: CreditBalanceClient | null
  isAuthenticated: boolean
  message?: string
}
export interface ThinkingState {
  isThinking: boolean
  message: string
  progress: number
}


// Polymarket API types (before database transformation)
export interface PolymarketEvent {
  id: string;
  title: string;
  description: string;
  slug: string;
  icon: string;
  image?: string;
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
  category: string;
}

// DTO for validated Polymarket API responses (strings before conversion)
export interface PolymarketEventDTO {
  id: string;
  title: string;
  description: string;
  slug: string;
  icon: string;
  image?: string;
  tags: Array<{
    id: string;
    label: string;
    slug: string;
    forceShow: boolean;
    updatedAt: string;
  }>;
  volume: number;
  startDate?: string | null;
  endDate?: string | null;
  markets: PolymarketMarketDTO[];
  category: string;
}

export interface PolymarketMarketDTO {
  id: string;
  question: string;
  description?: string;
  slug?: string;
  icon?: string;
  image?: string;
  outcomePrices: string; // JSON string
  outcomes?: string; // JSON string array
  volume: string;
  liquidity: string;
  active?: boolean;
  closed?: boolean;
  startDate?: string | null;
  endDate?: string | null;
  resolutionSource?: string;
  eventId?: string;
}

export interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  pricing: {
    prompt: string;
    completion: string;
    request: string;
    image: string;
  };
  context_length: number;
  architecture: {
    modality: string;
    tokenizer: string;
    instruct_type: string | null;
  };
  top_provider: {
    max_completion_tokens: number | null;
    is_moderated: boolean;
  };
  per_request_limits: {
    prompt_tokens: number;
    completion_tokens: number;
  } | null;
  created: number;
  canonical_slug: string;
  hugging_face_id: string | null;
  supported_parameters: string[] | null;
}

export interface PolymarketMarket {
  id: string;
  question: string;
  description?: string;
  slug?: string;
  icon?: string;
  image?: string;
  outcomePrices: string; // JSON string
  outcomes?: string; // JSON string array like "[\"Yes\", \"No\"]"
  volume: string;
  liquidity: string;
  active?: boolean;
  closed?: boolean;
  closedTime?: string | null; // When market was actually resolved (format: "2020-11-02 16:31:01+00")
  startDate?: Date | null;
  endDate?: Date | null;
  resolutionSource?: string;
  eventId?: string; // Added by us during processing
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
  outcomes: string[]
  outcomesProbabilities: number[]
  reasoning: string
  confidence_level: "High" | "Medium" | "Low"
}

export interface DatabaseMetadata {
  database: "neon"
  orm: "prisma"
  timestamp: string
  requestId: string
}

/**
 * DTOs: Serialized shapes safe for Client Components.
 * - All numbers are native JS numbers
 * - All dates are ISO strings
 * - Decimals are converted to numbers
 */
export type ISODateString = string

export interface EventDTO {
  id: string
  title: string
  description?: string | null
  slug?: string | null
  icon?: string | null
  image?: string | null
  tags?: unknown | null
  volume?: number | null
  endDate?: ISODateString | null
  marketProvider?: string | null
  updatedAt?: ISODateString | null
  startDate?: ISODateString | null
  category?: string | null
  providerCategory?: string | null
}

export interface MarketDTO {
  id: string
  question: string
  eventId: string
  outcomePrices: number[]
  volume?: string | null  // Serialized Decimal from tRPC
  liquidity?: string | null  // Serialized Decimal from tRPC
  description?: string | null
  active?: boolean | null
  closed?: boolean | null
  endDate?: ISODateString | null
  updatedAt?: ISODateString | null
  slug?: string | null
  startDate?: ISODateString | null
  resolutionSource?: string | null
  outcomes: string[]
  icon?: string | null
  image?: string | null
}

export interface PredictionDTO {
  id: string
  userMessage: string
  marketId: string
  predictionResult: PredictionResult
  modelName?: string | null
  systemPrompt?: string | null
  aiResponse?: string | null
  createdAt: ISODateString
  outcomes: string[]
  outcomesProbabilities: number[]
  userId?: string | null
  sessionId?: string | null
  experimentTag?: string | null
  experimentNotes?: string | null
}

export interface PredictionWithRelationsDTO {
  id: string
  userMessage: string
  marketId: string
  predictionResult: PredictionResult
  modelName?: string | null
  systemPrompt?: string | null
  aiResponse?: string | null
  createdAt: ISODateString
  outcomes: string[]
  outcomesProbabilities: number[]
  userId?: string | null
  sessionId?: string | null
  experimentTag?: string | null
  experimentNotes?: string | null
  market: (MarketDTO & { event: EventDTO | null }) | null
}

export interface PredictionCheckDTO {
  id: string
  predictionId?: string | null
  marketId?: string | null
  aiProbability?: number | null
  marketProbability?: number | null
  delta?: number | null
  absDelta?: number | null
  marketClosed?: boolean | null
  createdAt: ISODateString
}

export interface TagDTO {
  id: string
  label: string
  slug?: string | null
  forceShow?: boolean | null
  providerUpdatedAt?: string | null // ISO string
  provider?: string | null
  eventCount?: number
}

// Re-export all database types from Prisma for convenience
export type { 
  Event, 
  Market, 
  Prediction, 
  AiModel, 
  ResearchCache,
  Tag
} from "../lib/generated/prisma" 

