
import { marketQueries } from '../db/queries';
import { DEFAULT_MODEL } from '../data/ai-models';
import { parseAIResponse } from '../utils';

interface WebSearchResult {
  relevant_information: string;
  links: string[];
}

interface MarketResearchResponse {
  success: boolean;
  message: string;
  research?: WebSearchResult;
}

interface CacheEntry {
  timestamp: number;
  result: MarketResearchResponse;
}

const marketQueryCache = new Map<string, CacheEntry>();
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

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

    const cacheKey = `${marketId}-${modelName || DEFAULT_MODEL}`;
    const cachedEntry = marketQueryCache.get(cacheKey);

    if (cachedEntry && (Date.now() - cachedEntry.timestamp < CACHE_DURATION_MS)) {
      return cachedEntry.result;
    }

    // Fetch market data from the database
    const market = await marketQueries.getMarketById(marketId);

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

Focus on recent news, developments, and any factors that could influence the outcome.`;

    // Make the request to OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://betterai.com',
        'X-Title': 'BetterAI Market Research',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName || DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: systemMessage,
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
        
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.choices[0].message.content;

    const researchResult: WebSearchResult = parseAIResponse<WebSearchResult>(text);

    const result: MarketResearchResponse = {
      success: true,
      message: 'Market research completed successfully.',
      research: researchResult,
    };

    marketQueryCache.set(cacheKey, {
      timestamp: Date.now(),
      result,
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
