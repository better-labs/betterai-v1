# Scripts

This directory contains utility scripts for the BetterAI application.

## Cron Scripts

### `cron-update-ai-models.js`

Updates AI models from the OpenRouter API by calling the `/api/cron/update-ai-models` endpoint.

#### Usage

```bash
# Run the script
npm run cron:update-ai-models

# Dry run (test configuration without making requests)
npm run cron:update-ai-models -- --dry-run

# Run directly
node scripts/cron-update-ai-models.js
```

#### Environment Variables

- `CRON_SECRET` (required): Secret token for authentication
- `NEXT_PUBLIC_APP_URL` (optional): Base URL of the application (defaults to `http://localhost:3000`)

#### Features

- ✅ Automatic authentication with CRON_SECRET
- ✅ Detailed error reporting and helpful messages
- ✅ Timeout handling (30 seconds)
- ✅ Dry-run mode for testing
- ✅ Support for both HTTP and HTTPS
- ✅ Pretty console output with emojis

#### Example Output

```
🔄 Updating AI models from OpenRouter...
📍 Endpoint: http://localhost:3000/api/cron/update-ai-models
✅ AI models updated successfully!
⏱️  Duration: 1234ms
📊 Successfully synced AI models from OpenRouter
```

### `cron-update-trending.js`

Updates trending events and markets from Polymarket API.

#### Usage

```bash
npm run cron:update-trending
```

## Setting up Cron Jobs

### Local Development

Add to your crontab:

```bash
# Edit crontab
crontab -e

# Add these lines (adjust paths as needed)
0 */6 * * * cd /path/to/betterai && npm run cron:update-ai-models
0 */4 * * * cd /path/to/betterai && npm run cron:update-trending
```

### Production (Vercel)

Use Vercel Cron Jobs in your `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/update-ai-models",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/update-trending", 
      "schedule": "0 */4 * * *"
    }
  ]
}
```

## Environment Setup

Make sure your `.env.local` file contains:

```env
CRON_SECRET=your-secret-here
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
DATABASE_URL=your-database-url
``` 