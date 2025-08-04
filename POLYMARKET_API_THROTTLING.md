# Polymarket API Throttling Guide

This guide explains how to safely pull all events from the Polymarket API with proper throttling and pagination.

## Overview

The Polymarket API supports pagination using `limit` and `offset` parameters. To fetch all available events, you need to make multiple requests while respecting rate limits.

## API Endpoint

```
GET https://gamma-api.polymarket.com/events?limit={limit}&offset={offset}
```

## Parameters

- **limit**: Number of events per request (default: 100, max: 1000)
- **offset**: Starting position for pagination (0-based)

## Recommended Settings

### Production Settings (Conservative)
```typescript
{
  limit: 50,           // Smaller batches to avoid overwhelming the API
  delayMs: 2000,       // 2 second delay between requests
  maxRetries: 3,       // 3 retries per request
  retryDelayMs: 3000,  // 3 second delay before retry
  timeoutMs: 30000,    // 30 second timeout per request
  userAgent: "BetterAI/1.0"
}
```

### Development Settings (Aggressive)
```typescript
{
  limit: 100,          // Larger batches for faster fetching
  delayMs: 500,        // 0.5 second delay between requests
  maxRetries: 2,       // Fewer retries
  retryDelayMs: 1000,  // 1 second delay before retry
  timeoutMs: 15000,    // 15 second timeout
  userAgent: "BetterAI/1.0"
}
```

### Testing Settings (Minimal)
```typescript
{
  limit: 200,          // Large batch to get more events quickly
  delayMs: 100,        // Minimal delay
  maxRetries: 1,       // Single retry
  retryDelayMs: 500,   // Quick retry
  timeoutMs: 10000,    // 10 second timeout
  userAgent: "BetterAI/1.0"
}
```

## Usage Examples

### 1. Fetch All Events (Basic)
```typescript
import { fetchAllPolymarketEventsWithThrottling } from '@/lib/data/events'

const result = await fetchAllPolymarketEventsWithThrottling({
  limit: 100,
  delayMs: 1000,
  maxRetries: 3,
  retryDelayMs: 2000,
  timeoutMs: 30000,
  userAgent: "BetterAI/1.0"
})

console.log(`Fetched ${result.totalFetched} events in ${result.totalRequests} requests`)
console.log(`Errors: ${result.errors.length}`)
```

### 2. Update Database with All Events
```typescript
import { updatePolymarketAllEventsAndMarketDataWithThrottling } from '@/lib/data/events'

const result = await updatePolymarketAllEventsAndMarketDataWithThrottling({
  limit: 100,
  delayMs: 1000,
  maxRetries: 3,
  retryDelayMs: 2000,
  timeoutMs: 30000,
  userAgent: "BetterAI/1.0"
})

console.log(`Inserted ${result.insertedEvents.length} events`)
console.log(`Inserted ${result.insertedMarkets.length} markets`)
console.log(`Total fetched: ${result.totalFetched}`)
console.log(`Total requests: ${result.totalRequests}`)
```

### 3. Run the Example Script
```bash
# Using npm
npm run tsx scripts/fetch-all-polymarket-events.ts

# Using pnpm
pnpm tsx scripts/fetch-all-polymarket-events.ts
```

## Error Handling

The throttled functions handle various error scenarios:

### Rate Limiting (429)
- Automatically waits longer before retrying
- Uses exponential backoff

### Server Errors (5xx)
- Retries with exponential backoff
- Configurable max retry attempts

### Network Timeouts
- Configurable timeout per request
- Continues to next batch on timeout

### Invalid Responses
- Validates response format
- Filters out invalid events
- Logs errors for debugging

## Best Practices

### 1. Start Conservative
Begin with conservative settings and adjust based on API response:
```typescript
// Start with these settings
{
  limit: 50,
  delayMs: 2000,
  maxRetries: 3,
  retryDelayMs: 3000,
  timeoutMs: 30000
}
```

### 2. Monitor Response Times
Watch for signs of rate limiting:
- Increased response times
- 429 status codes
- Timeout errors

### 3. Adjust Based on Results
If you're getting rate limited, increase delays:
```typescript
// If getting rate limited, increase delays
{
  limit: 25,           // Smaller batches
  delayMs: 3000,       // Longer delays
  retryDelayMs: 5000   // Longer retry delays
}
```

### 4. Use Appropriate User-Agent
Always set a meaningful User-Agent:
```typescript
userAgent: "YourApp/1.0 (your-email@domain.com)"
```

## API Limits

Based on the Polymarket API documentation:

- **Default limit**: 100 events per request
- **Maximum limit**: 1000 events per request
- **Rate limits**: Not explicitly documented, but conservative approach recommended
- **Pagination**: Uses offset-based pagination

## Troubleshooting

### Common Issues

1. **Rate Limiting**
   - Increase `delayMs` between requests
   - Decrease `limit` to smaller batches
   - Increase `retryDelayMs` for longer waits

2. **Timeout Errors**
   - Increase `timeoutMs` for slower connections
   - Check network stability
   - Consider using smaller `limit` values

3. **Memory Issues**
   - Process events in smaller batches
   - Use streaming for very large datasets
   - Monitor memory usage during large fetches

4. **Invalid Data**
   - Check API response format
   - Validate event structure
   - Log and handle malformed events

### Debug Mode

Enable detailed logging by setting environment variable:
```bash
DEBUG_POLYMARKET_API=true
```

## Performance Considerations

### Expected Performance
- **Conservative settings**: ~50 events/second
- **Aggressive settings**: ~200 events/second
- **Minimal settings**: ~400 events/second

### Memory Usage
- Each event is approximately 2-5KB
- 10,000 events ≈ 20-50MB memory usage
- Consider streaming for very large datasets

### Network Usage
- Each request is approximately 50-200KB
- 100 requests ≈ 5-20MB network usage
- Monitor bandwidth usage for large fetches

## Security Considerations

1. **Rate Limiting**: Respect API limits to avoid being blocked
2. **User-Agent**: Use meaningful identification
3. **Error Handling**: Don't expose sensitive information in logs
4. **Retry Logic**: Implement exponential backoff to avoid overwhelming the API

## Monitoring

Track these metrics:
- Total events fetched
- Total requests made
- Error count and types
- Average response time
- Rate limiting incidents

## Support

For issues with the Polymarket API:
- Check their [API documentation](https://docs.polymarket.com/developers/gamma-markets-api/get-events)
- Monitor their status page
- Contact their support if needed 