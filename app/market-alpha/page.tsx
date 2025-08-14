'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { usePrivy } from '@privy-io/react-auth';

export default function MarketAlphaPage() {
  const { ready, authenticated, getAccessToken } = usePrivy();
  const [marketId, setMarketId] = useState('');
  const [modelName, setModelName] = useState('');
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ready || !authenticated) {
      setResult({ success: false, message: 'Please log in to use this feature.' });
      return;
    }
    
    setIsLoading(true);
    setResult(null);

    try {
      // Get access token for authenticated request
      const accessToken = await getAccessToken();
      
      const response = await fetch('/api/run-data-pipeline', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ marketId, modelName }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setResult({ success: false, message: 'Authentication failed. Please log in again.' });
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Market alpha error:', error);
      setResult({ success: false, message: 'An unexpected error occurred.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Show login prompt if not authenticated
  if (!ready) {
    return (
      <div className="container mx-auto p-4">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="text-center py-8">
            <p>Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="container mx-auto p-4">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">Please log in to access Market Alpha features.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Market Alpha Prediction</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="marketId">Market ID</Label>
              <Input
                id="marketId"
                value={marketId}
                onChange={(e) => setMarketId(e.target.value)}
                placeholder="Enter market ID"
                required
              />
            </div>
            <div>
              <Label htmlFor="modelName">Model Name (Optional)</Label>
              <Input
                id="modelName"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="e.g., claude-3-opus-20240229"
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Running Pipeline...' : 'Run Data Pipeline'}
            </Button>
          </form>

          {result && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold">Result:</h3>
              <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}