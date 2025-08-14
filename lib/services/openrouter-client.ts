import { parseAIResponse, validatePredictionResult } from '../utils';
import type { ZodSchema } from 'zod';

const OPENROUTER_API_BASE_URL = 'https://openrouter.ai/api/v1';
const OPENROUTER_DEFAULT_TEMPERATURE = 0.2;

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
      body: JSON.stringify({ temperature: OPENROUTER_DEFAULT_TEMPERATURE, ...body }),
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
      // Lightweight retry with exponential backoff to reduce transient failures
      const maxRetries = 3
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const backoffMs = 500 * Math.pow(2, attempt - 1)
        await new Promise((r) => setTimeout(r, backoffMs))
        const retry = await postWithBody({
          model,
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: userMessage },
          ],
          response_format: { type: 'json_object' },
        })
        if (retry.ok) {
          response = retry
          break
        }
        if (attempt === maxRetries) {
          throw new Error(`OpenRouter rate limit exceeded.`)
        }
      }
    } else {
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`)
    }
  }

  const data = await response.json();
  // Prefer structured tool call arguments when present (some models return JSON via tool calls)
  const toolArgs = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments ?? null;
  const text = toolArgs ?? (data.choices?.[0]?.message?.content ?? '');

  const parsed = parseAIResponse<unknown>(text);
  // Normalize common non-conforming shapes from providers (e.g., array wrappers)
  const normalized = normalizePredictionShape(parsed);
  // Enforce runtime schema validation
  const validated = validatePredictionResult(normalized);
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
    temperature: OPENROUTER_DEFAULT_TEMPERATURE,
  })

  if (!response.ok && (response.status === 400 || response.status === 422)) {
    response = await postWithBody({
      model,
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage },
      ],
      response_format: { type: 'json_object' },
      temperature: OPENROUTER_DEFAULT_TEMPERATURE,
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
  const normalized = normalizePredictionShape(parsed) as unknown as T;
  if (zodValidator) {
    return zodValidator.parse(normalized) as T;
  }
  return normalized as T;
}

// Best-effort normalization to coerce common malformed responses into the expected object shape
function normalizePredictionShape(value: unknown): unknown {
  // If it's an array, prefer the first object-like element
  if (Array.isArray(value)) {
    const firstObject = value.find((v) => v && typeof v === 'object') ?? value[0];
    return normalizePredictionShape(firstObject);
  }
  if (value && typeof value === 'object') {
    const v: any = value as any;
    // Unwrap common wrappers
    if (Array.isArray(v.result) || (v.result && typeof v.result === 'object')) {
      return normalizePredictionShape(v.result);
    }
    if (Array.isArray(v.data) || (v.data && typeof v.data === 'object')) {
      return normalizePredictionShape(v.data);
    }
    // Normalize key naming variants
    if ('confidenceLevel' in v && !('confidence_level' in v)) {
      v.confidence_level = v.confidenceLevel;
      delete v.confidenceLevel;
    }
    return v;
  }
  return value;
}
