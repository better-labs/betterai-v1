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

// Prediction Builder types
export interface ModelProvider {
  id: string           // 'google/gemini-2.5-pro'
  name: string         // 'Google Gemini'
  description: string
  costCredits: number  // Always 1 for now
}

export interface UserPredictionRequest {
  marketId: string
  userId: string
  selectedModels: string[]
  sessionId: string
}

export interface PredictionProgress {
  sessionId: string
  status: 'initializing' | 'researching' | 'predicting' | 'completed' | 'error'
  currentStep?: string
  completedModels: string[]
  totalModels: number
  results: Map<string, PredictionResult>
  error?: string
}

export interface PredictionSession {
  id: string
  marketId: string
  userId: string
  selectedModels: string[]
  status: 'initializing' | 'researching' | 'predicting' | 'completed' | 'error'
  progress: number
  currentStep?: string
  completedModels: string[]
  results: { [modelId: string]: PredictionResult }
  error?: string
  createdAt: string
  updatedAt: string
}

export interface DatabaseMetadata {
  database: "neon"
  orm: "prisma"
  timestamp: string
  requestId: string
}

/**
 * Type utilities for client-safe data
 * Use tRPC inferred types instead of manual DTOs
 */
export type ISODateString = string

// Re-export all database types from Prisma for convenience
export type { 
  Event, 
  Market, 
  Prediction, 
  AiModel, 
  ResearchCache,
  Tag
} from "../lib/generated/prisma" 

