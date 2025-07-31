# Test Suite Documentation

This directory contains comprehensive tests for the BetterAI application, with a focus on the events data layer.

## Test Structure

```
test/
├── README.md                    # This file
├── fixtures.ts                  # Test data fixtures
├── helpers.ts                   # Test utility functions
├── run-events-tests.js         # Test runner script
├── lib/
│   └── data/
│       └── events.test.ts      # Basic unit tests for events functions
├── routes/
│   └── events-edge-cases.test.ts # Edge case and error handling tests
├── e2e/
│   └── events-integration.test.ts # Integration tests
└── polymarket.test.ts          # Existing Polymarket API tests
```

## Test Categories

### 1. Unit Tests (`lib/data/events.test.ts`)
- **Purpose**: Test individual functions in isolation
- **Coverage**: All exported functions from `lib/data/events.ts`
- **Focus**: Happy path scenarios and basic error cases
- **Functions tested**:
  - `getTrendingEvents()`
  - `getTrendingEventsWithMarkets()`
  - `getEventById()`
  - `getEventBySlug()`
  - `createEvent()`
  - `updateEvent()`
  - `deleteEvent()`
  - `updateEventIcon()`
  - `updateTrendingEvents()`

### 2. Edge Case Tests (`routes/events-edge-cases.test.ts`)
- **Purpose**: Test error handling and boundary conditions
- **Coverage**: Database errors, API timeouts, invalid data
- **Focus**: Robustness and error recovery
- **Scenarios tested**:
  - Database connection failures
  - Polymarket API timeouts
  - Invalid event IDs
  - Empty or null data handling
  - Constraint violations
  - Concurrent operations

### 3. Integration Tests (`e2e/events-integration.test.ts`)
- **Purpose**: Test multiple functions working together
- **Coverage**: End-to-end workflows and data consistency
- **Focus**: Real-world usage patterns
- **Workflows tested**:
  - Complete event lifecycle (create → read → update → delete)
  - Trending events workflow
  - Data consistency across operations
  - Error recovery scenarios
  - Performance with large datasets

## Test Utilities

### Fixtures (`fixtures.ts`)
Provides realistic test data for events and markets:
- `eventFixtures`: Sample events with various trending ranks
- `marketFixtures`: Sample markets linked to events
- `polymarketEventFixtures`: Polymarket API response data
- Helper functions for filtering and finding test data

### Helpers (`helpers.ts`)
Utility functions for test setup and mock data:
- `createMockEvent()`: Factory for creating mock events
- `createMockMarket()`: Factory for creating mock markets
- `setupMockDb()`: Database mock setup
- `resetMocks()`: Clean up between tests

## Running Tests

### Run All Events Tests
```bash
npm test -- test/lib/data/events.test.ts test/routes/events-edge-cases.test.ts test/e2e/events-integration.test.ts
```

### Run Specific Test Categories
```bash
# Unit tests only
npm test -- test/lib/data/events.test.ts

# Edge cases only
npm test -- test/routes/events-edge-cases.test.ts

# Integration tests only
npm test -- test/e2e/events-integration.test.ts
```

### Run with Test Runner Script
```bash
node test/run-events-tests.js
```

### Run All Tests
```bash
npm test
```

## Test Coverage

The test suite covers:

- ✅ **Functionality**: All exported functions from events.ts
- ✅ **Error Handling**: Database errors, API failures, invalid inputs
- ✅ **Edge Cases**: Null values, empty arrays, constraint violations
- ✅ **Integration**: Multi-function workflows and data consistency
- ✅ **Performance**: Large dataset handling
- ✅ **Mocking**: Proper isolation of database and external dependencies

## Mocking Strategy

### Database Mocking
- Mocks the entire `@/lib/db` module
- Provides mock implementations for all database operations
- Allows testing without real database connections

### External API Mocking
- Mocks `@/lib/polymarket` module
- Simulates API responses and errors
- Tests error handling for external service failures

### Console Output Testing
- Tests that appropriate warnings and errors are logged
- Verifies error messages contain useful information

## Adding New Tests

### For New Functions
1. Add unit tests to `lib/data/events.test.ts`
2. Add edge case tests to `routes/events-edge-cases.test.ts`
3. Add integration tests to `e2e/events-integration.test.ts`

### For New Test Data
1. Add fixtures to `fixtures.ts`
2. Add helper functions to `helpers.ts`

### Test Naming Convention
- Unit tests: `should [expected behavior]`
- Edge cases: `should handle [error condition]`
- Integration: `should [workflow description]`

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Use `beforeEach()` to reset mocks
3. **Realistic Data**: Use fixtures for consistent test data
4. **Error Testing**: Always test both success and failure cases
5. **Performance**: Test with realistic data volumes
6. **Documentation**: Clear test descriptions and comments 