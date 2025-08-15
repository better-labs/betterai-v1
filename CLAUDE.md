# Claude Code Configuration

## Development Server

When running the development server, prefer using port 3002 or higher to avoid conflicts:

```bash
npm run dev -- --port 3002
```

or

```bash
yarn dev --port 3002
```

This helps avoid port conflicts with other development servers that commonly use ports 3000 and 3001.

## Pull Request Guidelines

**IMPORTANT**: When creating pull requests, always prepend "(claude)" to the beginning of the PR title.

Examples:
- `(claude) Add popular tags to recent predictions component`
- `(claude) Implement user authentication with Privy`
- `(claude) Fix CSP configuration for Vercel deployments`

This helps identify PRs created by Claude Code instances for better project management and review workflows.