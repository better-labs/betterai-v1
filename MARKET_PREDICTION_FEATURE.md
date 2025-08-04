# Market Prediction Feature

## Overview

This feature enhances the trending events table by adding logic to display the latest market prediction from the database when AI Prediction doesn't exist. If no prediction is available, it displays double hyphens "--".

## Changes Made

### 1. API Endpoint
- **File**: `app/api/markets/[marketId]/prediction/route.ts`
- **Purpose**: Fetches the latest market prediction for a specific market ID
- **Response**: Returns the prediction data or `null` if no prediction exists

### 2. MarketList Component Updates
- **File**: `components/market-list.tsx`
- **Changes**:
  - Added state management for market predictions (`marketPredictions`)
  - Added loading state management (`loadingMarketPredictions`)
  - Added `fetchMarketPrediction` function to call the API
  - Added `useEffect` to automatically fetch predictions for markets without AI predictions
  - Updated AI Prediction (Basic) section to display database predictions when available
  - Updated AI Prediction (Premium) section to show "--" when no prediction exists

### 3. Logic Flow

1. **AI Prediction Priority**: First checks if there's a current AI prediction (`predictions[market.id]`)
2. **Database Prediction**: If no AI prediction, checks for stored market prediction (`marketPredictions[market.id]`)
3. **Loading State**: Shows "..." while fetching
4. **Fallback**: Shows existing keyword-based fallbacks for specific markets
5. **No Data**: Shows "--" when no prediction is available

### 4. API Response Format

```json
{
  "prediction": {
    "prediction": "Yes",
    "probability": 0.75,
    "reasoning": "Based on current market conditions",
    "confidence_level": "High",
    
    "methodology": "AI analysis"
  },
  "createdAt": "2024-01-15T10:00:00Z",
  "modelName": "gpt-4o"
}
```

### 5. Error Handling

- API errors are caught and logged to console
- Loading states are properly managed
- Graceful fallback to existing behavior when API calls fail

## Testing

- Created test file: `test/market-prediction.test.ts`
- Tests cover successful API calls, null responses, and error handling
- All tests pass successfully

## Usage

The feature works automatically - when the MarketList component loads, it will:
1. Check each market for existing AI predictions
2. For markets without AI predictions, fetch the latest database prediction
3. Display the appropriate prediction or "--" if none exists
4. Show loading indicators during API calls

## Future Enhancements

- Add caching for database predictions to reduce API calls
- Add retry logic for failed API calls
- Add user feedback for prediction freshness
- Consider adding prediction confidence indicators 