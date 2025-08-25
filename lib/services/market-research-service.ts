import { prisma } from '../db/prisma'
import * as marketService from './market-service'
import * as researchCacheService from './research-cache-service'

const DEFAULT_MODEL = 'google/gemini-2.0-flash-thinking-exp'
import { z } from 'zod';
import { fetchStructuredFromOpenRouter } from './openrouter-client';

interface WebSearchResult {
  relevant_information: string;
  links: string[];
}

interface MarketResearchResponse {
  success: boolean;
  message: string;
  research?: WebSearchResult;
}



/**
 * Performs web research for a given market using OpenRouter AI
 * @param marketId - The unique identifier of the market (required)
 * @param modelName - The AI model to use for the research.
 * @returns Promise<MarketResearchResponse>
 */
export async function performMarketResearch(
  marketId: string,
  modelName?: string,
): Promise<MarketResearchResponse> {
  try {
    if (!marketId) {
      return {
        success: false,
        message: 'Market ID is required',
      };
    }

    const model = modelName || DEFAULT_MODEL;

    const cachedEntry = await researchCacheService.getCachedResearch(prisma, marketId, model);

    if (cachedEntry && cachedEntry.response) {
      return cachedEntry.response as unknown as MarketResearchResponse;
    }

    // Fetch market data from the database
    const market = await marketService.getMarketById(prisma, marketId);

    if (!market) {
      return {
        success: false,
        message: `Market with ID ${marketId} not found in the database`,
      };
    }

    // Generate system and user messages for the OpenRouter request
    const systemMessage = `You are a research assistant. Your task is to perform a web search to find the most relevant and up-to-date information for the given market to help an AI model make an accurate prediction.

Format your response as a JSON object with the following structure:
{
  "relevant_information": "A summary of the most important information you found.",
  "links": ["list", "of", "relevant", "URLs"]
}

IMPORTANT: You *must* perform a web search and the 'links' array cannot be empty. Return ONLY a valid JSON object. Do NOT wrap your response in markdown code blocks, backticks, or any other formatting. Return pure JSON.`;

    const userMessage = `Please perform a web search for the latest information regarding the following market:

Market: "${market.question}"
${
  market.description
    ? `Market Description: ${market.description}`
    : ''
}
${
  market.endDate
    ? `Market End Date: ${market.endDate.toISOString().split('T')[0]}`
    : ''
}
${
  market.resolutionSource
    ? `Resolution Source: ${market.resolutionSource}`
    : ''
}

Focus on recent news, developments, and any factors that could influence the outcome.`;

    // Enforce structured output with schema + zod validation
    const webResearchSchemaJson = {
      type: 'object',
      additionalProperties: false,
      required: ['relevant_information', 'links'],
      properties: {
        relevant_information: { type: 'string', minLength: 10 },
        links: {
          type: 'array',
          items: { type: 'string', minLength: 1 },
          minItems: 1,
        },
      },
    } as const;

    const webResearchZod = z.object({
      relevant_information: z.string().min(10),
      links: z.array(z.string().min(1)).min(1),
    });

    const researchResult = await fetchStructuredFromOpenRouter<WebSearchResult>(
      model,
      systemMessage,
      userMessage,
      webResearchSchemaJson as unknown as Record<string, unknown>,
      webResearchZod,
    );

    const result: MarketResearchResponse = {
      success: true,
      message: 'Market research completed successfully.',
      research: researchResult,
    };

    await researchCacheService.createResearchCache(prisma, {
      marketId: marketId,
      modelName: model,
      systemMessage: systemMessage,
      userMessage: userMessage,
      response: result,
    });

    return result;
  } catch (error) {
    console.error('Error performing market research:', error);
    const message = error instanceof Error ? error.message : 'Unexpected error occurred';
    return {
      success: false,
      message: message,
    };
  }
}