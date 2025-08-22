import { describe, it, expect } from 'vitest';
import { 
  validateOpenRouterPredictionSafe,
  validatePolymarketEventSafe,
  validateCreditsResponseSafe,
  ApiResponseValidationError 
} from '@/lib/validation/response-validator';

describe('Response Validator', () => {
  describe('OpenRouter Prediction Validation', () => {
    it('should validate valid OpenRouter prediction', () => {
      const validPrediction = {
        prediction: 'Yes',
        outcomes: ['Yes', 'No'],
        outcomesProbabilities: [0.7, 0.3],
        reasoning: 'Based on current market trends and analysis, this outcome is likely.',
        confidence_level: 'High' as const
      };

      const result = validateOpenRouterPredictionSafe(validPrediction);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.prediction).toBe('Yes');
        expect(result.data.confidence_level).toBe('High');
      }
    });

    it('should reject invalid OpenRouter prediction', () => {
      const invalidPrediction = {
        prediction: 'Yes',
        outcomes: ['Yes'], // Should have 2 outcomes
        outcomesProbabilities: [0.7, 0.3],
        reasoning: 'Short', // Too short
        confidence_level: 'Invalid' // Invalid confidence level
      };

      const result = validateOpenRouterPredictionSafe(invalidPrediction);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid');
      }
    });
  });

  describe('Polymarket Event Validation', () => {
    it('should validate valid Polymarket event', () => {
      const validEvent = {
        id: 'event-123',
        title: 'Test Event',
        description: 'A test event for validation',
        slug: 'test-event',
        icon: 'icon-url',
        image: 'image-url',
        tags: [
          {
            id: 'tag-1',
            label: 'Politics',
            slug: 'politics',
            forceShow: false,
            updatedAt: '2024-01-01T00:00:00Z'
          }
        ],
        volume: 1000,
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z',
        markets: [],
        category: 'Politics'
      };

      const result = validatePolymarketEventSafe(validEvent);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Test Event');
        expect(result.data.category).toBe('Politics');
      }
    });

    it('should reject event with missing required fields', () => {
      const invalidEvent = {
        id: 'event-123',
        // Missing title
        description: 'A test event for validation',
        slug: 'test-event',
        icon: 'icon-url',
        tags: [],
        volume: 1000,
        markets: [],
        category: 'Politics'
      };

      const result = validatePolymarketEventSafe(invalidEvent);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('title');
      }
    });
  });

  describe('Credits Response Validation', () => {
    it('should validate valid credits response', () => {
      const validCreditsResponse = {
        credits: {
          credits: 100,
          creditsLastReset: '2024-01-01T00:00:00Z',
          totalCreditsEarned: 500,
          totalCreditsSpent: 400
        },
        isAuthenticated: true,
        message: 'Credits retrieved successfully'
      };

      const result = validateCreditsResponseSafe(validCreditsResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isAuthenticated).toBe(true);
        expect(result.data.credits?.credits).toBe(100);
      }
    });

    it('should validate null credits for unauthenticated user', () => {
      const unauthenticatedResponse = {
        credits: null,
        isAuthenticated: false,
        message: 'User not authenticated'
      };

      const result = validateCreditsResponseSafe(unauthenticatedResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isAuthenticated).toBe(false);
        expect(result.data.credits).toBeNull();
      }
    });
  });
});
