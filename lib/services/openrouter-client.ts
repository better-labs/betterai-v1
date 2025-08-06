import { parseAIResponse } from '../utils';
import type { PredictionResult } from '../types';

const OPENROUTER_API_BASE_URL = 'https://openrouter.ai/api/v1';

interface OpenRouterPredictionResult {
  prediction: string;
  probability: number;
  reasoning: string;
  confidence_level: "High" | "Medium" | "Low";
}

export async function fetchPredictionFromOpenRouter(
  model: string,
  systemMessage: string,
  userMessage: string
): Promise<OpenRouterPredictionResult> {
  const response = await fetch(`${OPENROUTER_API_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://betterai.com',
      'X-Title': 'BetterAI Prediction Service',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage },
      ],
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error(`OpenRouter rate limit exceeded.`);
    }
    throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const text = data.choices[0].message.content;

  return parseAIResponse<OpenRouterPredictionResult>(text);
}
