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