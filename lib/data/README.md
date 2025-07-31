# Data Layer Architecture

This project uses a hybrid approach for data access, combining direct database functions with HTTP API routes.

## Structure

```
lib/data/
├── events.ts      # Core event data functions
├── markets.ts     # Core market data functions
├── predictions.ts # Core prediction data functions
└── README.md     # This file

app/api/
├── events/
│   └── route.ts   # HTTP wrapper for events
├── markets/
│   └── route.ts   # HTTP wrapper for markets
└── cron/
    └── update-trending/
        └── route.ts # Cron job endpoints
```

## Usage Patterns

### 1. Server Components (Direct Data Functions)

For server-side rendering and static generation, use the data functions directly:

```typescript
// app/events/page.tsx
import { getTrendingEvents } from '@/lib/data/events'

export default async function EventsPage() {
  const events = await getTrendingEvents()
  return <EventList events={events} />
}
```

**Benefits:**
- ✅ No HTTP overhead
- ✅ Full TypeScript support
- ✅ Better performance
- ✅ Direct error handling

### 2. Client Components (API Routes)

For client-side data fetching, use the API routes:

```typescript
// components/event-list.tsx
'use client'
import { useEffect, useState } from 'react'

export function EventList() {
  const [events, setEvents] = useState([])
  
  useEffect(() => {
    fetch('/api/events')
      .then(res => res.json())
      .then(data => setEvents(data.data))
  }, [])
  
  return <div>{/* render events */}</div>
}
```

**Benefits:**
- ✅ Works in client components
- ✅ HTTP caching
- ✅ Can be called from external services

### 3. External Services (API Routes)

For cron jobs and external integrations:

```bash
# Cron job example
curl -X POST https://your-app.com/api/cron/update-trending \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Benefits:**
- ✅ External access
- ✅ Authentication/authorization
- ✅ Monitoring and logging

## API Endpoints

### Events API (`/api/events`)

- `GET /api/events` - Get trending events
- `GET /api/events?id=123` - Get specific event
- `GET /api/events?slug=event-slug` - Get event by slug
- `POST /api/events` - Create new event
- `PUT /api/events?id=123` - Update event
- `DELETE /api/events?id=123` - Delete event

### Markets API (`/api/markets`)

- `GET /api/markets` - Get high volume markets
- `GET /api/markets?id=123` - Get specific market
- `GET /api/markets?eventId=456` - Get markets for event
- `GET /api/markets?highVolume=true&limit=10` - Get high volume markets
- `POST /api/markets` - Create new market
- `PUT /api/markets?id=123` - Update market
- `DELETE /api/markets?id=123` - Delete market

### Cron Jobs (`/api/cron/`)

- `POST /api/cron/update-trending` - Update trending events
- `GET /api/cron/update-trending` - Get endpoint info

## Type Safety

All functions and APIs use shared types from `lib/types.ts`:

```typescript
import type { Event, Market, ApiResponse } from '@/lib/types'
```

## Error Handling

### Data Functions
```typescript
try {
  const events = await getTrendingEvents()
} catch (error) {
  console.error('Database error:', error)
  // Handle error appropriately
}
```

### API Routes
```typescript
// API routes return standardized responses
{
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp?: string
}
```

## Best Practices

1. **Use data functions for server components** - Better performance and type safety
2. **Use API routes for client components** - Enables client-side interactivity
3. **Use API routes for external access** - Enables cron jobs and integrations
4. **Share types** - Import from `lib/types.ts` for consistency
5. **Handle errors gracefully** - Both functions and APIs should handle errors properly
6. **Add authentication for cron jobs** - Protect sensitive operations

## Adding New Data Functions

1. Create the data function in `lib/data/[entity].ts`
2. Add corresponding API route in `app/api/[entity]/route.ts`
3. Update types in `lib/types.ts` if needed
4. Document the new functionality

## Migration from Express.js

When migrating Express.js routes:

1. **Extract business logic** into `lib/data/` functions
2. **Create API routes** that wrap the data functions
3. **Update types** to match your database schema
4. **Test both patterns** - direct functions and HTTP APIs 