// Examples of how to use the rate limiting utilities in your components

'use client';

import { useState } from 'react';
import { Button } from '@/src/shared/ui/button';
import { RateLimitWarning, RateLimitBadge } from '@/src/shared/ui/rate-limit-warning';
import { apiPost } from './api-handler';
import { useRateLimit } from './use-rate-limit';

// Example 1: Simple API call with automatic error handling
export function PredictButton({ marketId }: { marketId: string }) {
  const [loading, setLoading] = useState(false);
  const { getRateLimitInfo, isRateLimited, updateFromResponse } = useRateLimit();
  
  const handlePredict = async () => {
    if (isRateLimited('/api/predict')) {
      return; // Button should be disabled
    }
    
    setLoading(true);
    try {
      await apiPost('/api/predict', 
        { marketId },
        {
          showSuccessToast: true,
          successMessage: 'Prediction generated successfully!',
          onRateLimit: (resetTime) => {
            console.log('Rate limited until:', resetTime);
          }
        }
      );
    } catch (error) {
      // Error handling is done by apiPost
      console.error('Prediction failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const rateLimitInfo = getRateLimitInfo('/api/predict');
  const isBlocked = isRateLimited('/api/predict');

  return (
    <div className="space-y-2">
      <Button 
        onClick={handlePredict}
        disabled={loading || isBlocked}
        className="w-full"
      >
        {loading ? 'Generating...' : 'Generate Prediction'}
        {rateLimitInfo && (
          <RateLimitBadge
            remaining={rateLimitInfo.remaining}
            resetTime={rateLimitInfo.resetTime}
            className="ml-2"
          />
        )}
      </Button>
      
      {rateLimitInfo && rateLimitInfo.remaining <= 3 && (
        <RateLimitWarning
          remaining={rateLimitInfo.remaining}
          resetTime={rateLimitInfo.resetTime}
        />
      )}
    </div>
  );
}

// Example 2: Manual fetch with custom error handling
export function DataPipelineButton({ marketId }: { marketId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunPipeline = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/run-data-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketId })
      });

      if (response.status === 429) {
        const errorData = await response.json();
        setError(`Rate limit exceeded. Try again at ${new Date(errorData.resetAt).toLocaleTimeString()}`);
        return;
      }

      if (!response.ok) {
        throw new Error('Pipeline failed');
      }

      const data = await response.json();
      console.log('Pipeline completed:', data);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button onClick={handleRunPipeline} disabled={loading}>
        {loading ? 'Running Pipeline...' : 'Run Data Pipeline'}
      </Button>
      
      {error && (
        <RateLimitWarning
          remaining={0}
          resetTime={new Date(Date.now() + 3600000)} // 1 hour from now
          variant="destructive"
        />
      )}
    </div>
  );
}

// Example 3: Using the hook for proactive rate limit display
export function RateLimitDashboard() {
  const { rateLimits } = useRateLimit();

  const endpoints = [
    { key: '/api/predict', name: 'AI Predictions', limit: 10 },
    { key: '/api/run-data-pipeline', name: 'Research Requests', limit: 5 },
    { key: '/api/user', name: 'Profile Updates', limit: 50 }
  ];

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">API Usage</h3>
      {endpoints.map(endpoint => {
        const info = rateLimits[endpoint.key];
        if (!info) return null;

        return (
          <div key={endpoint.key} className="flex justify-between items-center p-2 border rounded">
            <span className="text-sm font-medium">{endpoint.name}</span>
            <div className="text-sm text-muted-foreground">
              {info.remaining}/{endpoint.limit} remaining
            </div>
          </div>
        );
      })}
    </div>
  );
}