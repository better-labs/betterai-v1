
import { performMarketResearch } from './market-research-service';
import { generatePredictionForMarket } from './generate-single-prediction';
import type { PredictionResult } from '../types';

interface DataPipelineResponse {
  success: boolean;
  message: string;
  prediction?: PredictionResult;
}
/**
 * Runs the complete data pipeline for a given market ID
 * 
 * The pipeline consists of two main steps:
 * 1. Performs market research using AI to gather relevant information
 * 2. Generates a prediction based on the research results
 * 
 * @param marketId - The unique identifier of the market to analyze
 * @param modelName - Optional AI model name to use for research and predictions
 * @returns Promise<DataPipelineResponse> containing success status, message and prediction result
 */

export async function runDataPipeline(
  marketId: string,
  modelName?: string,
): Promise<DataPipelineResponse> {
  try {
    if (!marketId) {
      return {
        success: false,
        message: 'Market ID is required',
      };
    }

    const researchResult = await performMarketResearch(marketId, modelName);

    if (!researchResult.success || !researchResult.research) {
      return {
        success: false,
        message: researchResult.message || 'Failed to get market research.',
      };
    }

    const predictionResult = await generatePredictionForMarket(
      marketId,
      undefined, // userId
      modelName,
      JSON.stringify(researchResult.research),
    );

    if (!predictionResult.success) {
      return {
        success: false,
        message: predictionResult.message || 'Failed to get prediction.',
      };
    }

    return {
      success: true,
      message: 'Data pipeline completed successfully.',
      prediction: predictionResult.prediction,
    };
  } catch (error) {
    console.error('Error in data pipeline:', error);
    const message = error instanceof Error ? error.message : 'Unexpected error occurred';
    return {
      success: false,
      message: message,
    };
  }
}
