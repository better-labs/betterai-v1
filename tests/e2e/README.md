# E2E Tests for BetterAI

This directory contains end-to-end tests for the BetterAI application using Playwright.

## Setup

The tests are automatically configured when you run them. They include:

- **Test authentication**: Uses a special test-login endpoint that bypasses Privy
- **Test data**: Creates a test user with credits for authenticated flows
- **Browser support**: Runs tests in Chromium, Firefox, and WebKit

## Running Tests

```bash
# Run all E2E tests
pnpm test:e2e

# Run tests in headed mode (see browser)
pnpm test:e2e:headed

# View test report
pnpm test:e2e:report

# List all available tests
E2E_TEST_MODE=1 npx playwright test --list
```

## Test Coverage

The smoke tests cover:

1. **Landing Page Flow**: Landing page → AI leaderboard navigation
2. **Authenticated Dashboard**: Home page with predictions when logged in  
3. **Navigation**: Header navigation between main pages
4. **Predictions**: Clicking on prediction items
5. **Basic Functionality**: Page loads, no JS errors

## Test Structure

- `global-setup.ts`: Sets up authentication state before tests
- `smoke.spec.ts`: Main smoke tests for basic app functionality
- Test data is created automatically in test mode

## Environment Variables

- `E2E_TEST_MODE=1`: Enables test mode (automatically set by npm scripts)
- Tests will create a test user: `e2e-test-user-123`

## Notes

- Tests use `data-testid` attributes for stable element selection
- Test authentication bypasses Privy OAuth for reliability
- Browser downloads and dependencies are handled automatically by Playwright