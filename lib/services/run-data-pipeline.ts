
import { performMarketResearch } from './market-research-service';
import { generatePredictionForMarket } from './generate-single-prediction';

interface DataPipelineResponse {
  success: boolean;
  message: string;
  prediction?: any;
}

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
