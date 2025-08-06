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

// Re-export all database types from Prisma for convenience
export type { 
  Event, 
  Market, 
  Prediction, 
  AiModel, 
  MarketQueryCache
} from "../lib/generated/prisma" 

