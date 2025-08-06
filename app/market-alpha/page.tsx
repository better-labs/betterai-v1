'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export default function MarketAlphaPage() {
  const [marketId, setMarketId] = useState('');
  const [modelName, setModelName] = useState('');
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/run-data-pipeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ marketId, modelName }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, message: 'An unexpected error occurred.' });
    } finally {
      setIsLoading(false);
    }
  };

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