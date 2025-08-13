import { parseAIResponse, validatePredictionResult } from '../utils';
import type { ZodSchema } from 'zod';

const OPENROUTER_API_BASE_URL = 'https://openrouter.ai/api/v1';

interface OpenRouterPredictionResult {
  prediction: string;
  outcomes: string[];
  outcomesProbabilities: number[];
  reasoning: string;
  confidence_level: "High" | "Medium" | "Low";
}

export async function fetchPredictionFromOpenRouter(
  model: string,
  systemMessage: string,
  userMessage: string
): Promise<OpenRouterPredictionResult> {
  const PREDICTION_JSON_SCHEMA = {
    name: 'prediction_result',
    strict: true,
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['prediction', 'outcomes', 'outcomesProbabilities', 'reasoning', 'confidence_level'],
      properties: {
        prediction: { type: 'string', minLength: 1 },
        outcomes: {
          type: 'array',
          items: { type: 'string', minLength: 1 },
          minItems: 2,
          maxItems: 2,
          uniqueItems: true,
        },
        outcomesProbabilities: {
          type: 'array',
          items: { type: 'number', minimum: 0, maximum: 1 },
          minItems: 2,
          maxItems: 2,
          description: 'Two numbers that sum to 1 and align with outcomes order',
        },
        reasoning: { type: 'string', minLength: 10 },
        confidence_level: { type: 'string', enum: ['High', 'Medium', 'Low'] },
      },
    },
  } as const

  async function postWithBody(body: Record<string, unknown>) {
    return fetch(`${OPENROUTER_API_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://betterai.com',
        'X-Title': 'BetterAI Prediction Service',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  }

  // Try json_schema first; if provider/model rejects it, fall back to json_object
  let response = await postWithBody({
    model,
    messages: [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userMessage },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: PREDICTION_JSON_SCHEMA,
    },
  })

  if (!response.ok && (response.status === 400 || response.status === 422)) {
    response = await postWithBody({
      model,
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage },
      ],
      response_format: { type: 'json_object' },
    })
  }

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error(`OpenRouter rate limit exceeded.`);
    }
    throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  // Prefer structured tool call arguments when present (some models return JSON via tool calls)
  const toolArgs = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments ?? null;
  const text = toolArgs ?? (data.choices?.[0]?.message?.content ?? '');

  const parsed = parseAIResponse<OpenRouterPredictionResult>(text);
  // Enforce runtime schema validation
  const validated = validatePredictionResult(parsed);
  return validated as OpenRouterPredictionResult;
}

/**
 * Generic structured-output fetcher using OpenRouter with json_schema enforcement
 * and fallback to json_object. Prefers tool call arguments when present.
 */
export async function fetchStructuredFromOpenRouter<T>(
  model: string,
  systemMessage: string,
  userMessage: string,
  jsonSchema: Record<string, unknown>,
  zodValidator?: ZodSchema<T>,
): Promise<T> {
  function wrapSchema(schema: Record<string, unknown>) {
    return {
      name: 'structured_result',
      strict: true,
      schema,
    } as const;
  }

  async function postWithBody(body: Record<string, unknown>) {
    return fetch(`${OPENROUTER_API_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://betterai.com',
        'X-Title': 'BetterAI Structured Client',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  }

  let response = await postWithBody({
    model,
    messages: [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userMessage },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: wrapSchema(jsonSchema),
    },
    temperature: 0.2,
  })

  if (!response.ok && (response.status === 400 || response.status === 422)) {
    response = await postWithBody({
      model,
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    })
  }

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error(`OpenRouter rate limit exceeded.`);
    }
    throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const toolArgs = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments ?? null;
  const text = toolArgs ?? (data.choices?.[0]?.message?.content ?? '');

  const parsed = parseAIResponse<T>(text);
  if (zodValidator) {
    return zodValidator.parse(parsed) as T;
  }
  return parsed as T;
}
