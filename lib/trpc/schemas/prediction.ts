/**
 * Zod input schemas for Predictions API
 * Input validation only - response types are inferred from service returns
 */

import { z } from 'zod'

// List predictions with filtering and pagination
export const GetPredictionsInput = z.object({
  // Single prediction query
  id: z.number().int().positive().optional(),
  
  // Filter by market
  marketId: z.string().optional(),
  
  // Filter by user
  userId: z.string().optional(),
  
  // Filter by experiment tag
  experimentTag: z.string().optional(),
  
  // Search in user message
  search: z.string().min(1).max(200).optional(),
  
  // Pagination
  limit: z.number().int().positive().max(100).optional().default(50),
  cursor: z.number().int().optional(),
  
  // Sorting options
  sort: z.enum(['recent', 'oldest']).optional().default('recent'),
  
  // Sort mode for recent predictions
  sortMode: z.enum(['markets', 'predictions']).optional().default('markets'),
  
  // Include market context in response
  includeMarket: z.boolean().optional().default(false),
  
  // Filter by tag IDs
  tagIds: z.array(z.string()).optional(),
})

// Single prediction by ID with market context
export const GetPredictionByIdInput = z.object({
  id: z.number().int().positive({ message: 'Prediction ID must be a positive integer' }),
  includeMarket: z.boolean().optional().default(true),
})

// Get predictions by market ID
export const GetPredictionsByMarketInput = z.object({
  marketId: z.string().min(1, 'Market ID is required'),
  limit: z.number().int().positive().max(100).optional().default(50),
  includeMarket: z.boolean().optional().default(false),
})

// Get recent predictions (main feed endpoint)
export const GetRecentPredictionsInput = z.object({
  limit: z.number().int().positive().max(100).optional().default(20),
  cursor: z.number().int().optional(),
  sortMode: z.enum(['markets', 'predictions']).optional().default('markets'),
  tagIds: z.array(z.string()).optional(),
})

// Search predictions by user message
export const SearchPredictionsInput = z.object({
  query: z.string().min(1, 'Search query is required').max(200),
  limit: z.number().int().positive().max(100).optional().default(50),
  includeMarket: z.boolean().optional().default(false),
})

// Get most recent prediction for a market
export const GetMostRecentPredictionInput = z.object({
  marketId: z.string().min(1, 'Market ID is required'),
})

// Prediction result schema for validation
export const PredictionResultSchema = z.object({
  prediction: z.string().min(1, 'Prediction is required'),
  outcomes: z.array(z.string().min(1)).min(1, 'At least one outcome is required'),
  outcomesProbabilities: z.array(z.number().min(0).max(1)).min(1, 'At least one probability is required'),
  reasoning: z.string().min(1, 'Reasoning is required'),
  confidence_level: z.enum(['High', 'Medium', 'Low']),
})

// Create prediction (authenticated users)
export const CreatePredictionInput = z.object({
  userMessage: z.string().min(1, 'User message is required').max(5000),
  marketId: z.string().min(1, 'Market ID is required'),
  predictionResult: PredictionResultSchema,
  modelName: z.string().optional(),
  systemPrompt: z.string().max(10000).optional(),
  aiResponse: z.string().max(50000).optional(),
  outcomes: z.array(z.string().min(1)).min(1, 'At least one outcome is required'),
  outcomesProbabilities: z.array(z.number().min(0).max(1)).min(1, 'At least one probability is required'),
  experimentTag: z.string().optional(),
  experimentNotes: z.string().max(1000).optional(),
})

// Update prediction (admin only)
export const UpdatePredictionInput = z.object({
  id: z.number().int().positive({ message: 'Prediction ID must be a positive integer' }),
  userMessage: z.string().min(1).max(5000).optional(),
  predictionResult: PredictionResultSchema.optional(),
  modelName: z.string().optional(),
  systemPrompt: z.string().max(10000).optional(),
  aiResponse: z.string().max(50000).optional(),
  outcomes: z.array(z.string().min(1)).optional(),
  outcomesProbabilities: z.array(z.number().min(0).max(1)).optional(),
  experimentTag: z.string().optional(),
  experimentNotes: z.string().max(1000).optional(),
})

// Delete prediction (admin only)
export const DeletePredictionInput = z.object({
  id: z.number().int().positive({ message: 'Prediction ID must be a positive integer' }),
})

// Batch create predictions (admin only)
export const BatchCreatePredictionsInput = z.object({
  predictions: z.array(CreatePredictionInput).min(1).max(50),
})