# BetterAI

A Next.js prediction market application that integrates with Polymarket and Colosseum APIs, featuring AI-powered market predictions.

## Features

- **AI-Powered Predictions**: Generate predictions for prediction markets using advanced AI models
- **Market Integration**: Connect with Polymarket and other prediction market platforms
- **Real-time Data**: Live market data and prediction tracking
- **User Authentication**: Secure authentication using Privy
- **Responsive Design**: Modern UI built with shadcn/ui components

## Authentication

This application uses [Privy](https://privy.io/) for user authentication following their official best practices:

### Client-Side Authentication
- Uses `usePrivy()` hook for authentication state management
- Implements bearer token approach for API requests
- Automatic token refresh and error handling

### Server-Side Authentication
- All privileged API endpoints require authentication
- Uses Privy's server SDK for token verification
- User context is available in all authenticated requests

### Protected Endpoints
The following API endpoints require authentication:
- `GET /api/predictions/recent` - Recent predictions
- `POST /api/predict` - Generate new predictions
- `POST /api/run-data-pipeline` - Run data pipeline
- `GET /api/markets/[marketId]/prediction` - Market predictions

### Environment Variables
```bash
# Privy Configuration
PRIVY_PUBLIC_APP_ID=your-privy-app-id
PRIVY_SERVER_APP_SECRET=your-privy-app-secret
PRIVY_SERVER_VERIFICATION_KEY=your-privy-verification-key
```

## Getting Started

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Set up environment variables (see `.env.example`)
4. Run the development server: `pnpm dev`

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Privy
- **UI**: shadcn/ui with Tailwind CSS
- **AI**: OpenRouter API integration
- **Deployment**: Vercel

## License

MIT


