# Project Overview

This is a Next.js application that serves as a market prediction tool. It allows users to get AI-powered predictions on the outcomes of various markets, such as those on Polymarket. The application uses a variety of AI models to generate these predictions and enriches them with data from sources like Twitter/X and news articles.

## Key Technologies

*   **Frontend:** Next.js, React, TypeScript, Tailwind CSS
*   **Backend:** Next.js API Routes
*   **Database:** PostgreSQL with Drizzle ORM
*   **AI:** OpenRouter for accessing various large language models
*   **Styling:** Shadcn/ui and custom components

## Architecture

The application is a monolithic Next.js app. The frontend is built with React and server components, and the backend is implemented as API routes within the same Next.js project. The database schema is managed with Drizzle ORM, and migrations are handled by `drizzle-kit`. The prediction logic is encapsulated in a `prediction-service.ts` file, which communicates with the OpenRouter API to get AI-powered predictions.

## Building and Running

### Prerequisites

*   Node.js and pnpm
*   PostgreSQL database

### Installation

1.  Clone the repository.
2.  Install dependencies: `pnpm install`
3.  Set up your environment variables by copying `.env.example` to `.env.local` and filling in the required values.
4.  Run database migrations: `pnpm run db:migrate`

### Running the Application

*   **Development:** `pnpm run dev`
*   **Production:** `pnpm run build` and then `pnpm run start`

### Testing

*   Run all tests: `pnpm test`
*   Run tests in watch mode: `pnpm test:watch`

## Development Conventions

*   **Code Style:** The project uses ESLint and Prettier for code formatting and linting.
*   **Database:** Drizzle ORM is used for database access. Schema changes should be made in `lib/db/schema.ts`, and migrations should be generated with `drizzle-kit`.
*   **API:** Backend logic is implemented in Next.js API routes in the `app/api` directory.
*   **UI:** The UI is built with Shadcn/ui components and custom components in the `components` directory.
*   **State Management:** State is managed with React hooks and context.
