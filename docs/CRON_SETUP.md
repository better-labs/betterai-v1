# Cron Job Setup

This guide shows you how to set up automated cron jobs to trigger the benchmark pipeline using your existing environment configuration.

## Prerequisites

1. **Environment Variables**: The `CRON_SECRET` has been added to your environment files:
   - `.env.example` - Template with placeholder values
   - `.env.local` - Your local environment (already configured)

2. **Deploy your application** to a hosting service

## Environment Configuration

### Local Development
Your `.env.local` file already includes the `CRON_SECRET` variable. Make sure to set a secure value:

```bash
# In .env.local
CRON_SECRET=your-actual-secret-token-here
```

### Production Deployment
When deploying to production, ensure the `CRON_SECRET` environment variable is set in your hosting platform.

## Option 1: Vercel Cron Jobs (Recommended for Vercel)

If you're using Vercel, this is the easiest option:

1. **Deploy with vercel.json** (already created):
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/update-polymarket-data",
         "schedule": "0 */6 * * *"
       },
       {
         "path": "/api/cron/generate-batch-predictions",
         "schedule": "15 2 * * *"
       },
       {
         "path": "/api/cron/prediction-check",
         "schedule": "30 2 * * *"
       }
     ]
   }
   ```

2. **Set environment variable** in Vercel dashboard:
   - Go to your project settings → Environment Variables
   - Add `CRON_SECRET` with your secure token value
   - Deploy

3. **Schedule**: Runs every 6 hours (adjust as needed)

## Option 2: Node.js Script (Local/Server Cron Job)

1. **Scripts (already created):**
   ```bash
   pnpm cron:update-polymarket-data
   pnpm cron:batch-predictions
   pnpm cron:prediction-check
   ```

2. **Environment variables** are automatically loaded from `.env.local`:
   - The script uses `process.env.CRON_SECRET`
   - The script uses `process.env.DOMAIN` (defaults to localhost:3000)

3. **Add to system cron**:
   ```bash
   # Edit crontab
   crontab -e
   
   # Sample schedule
   0 */6 * * * cd /path/to/your/project && pnpm cron:update-polymarket-data
   15 2 * * * cd /path/to/your/project && pnpm cron:batch-predictions
   30 2 * * * cd /path/to/your/project && pnpm cron:prediction-check
   ```

## Testing Your Setup

### Manual Testing
```bash
# Test locally (uses .env.local automatically)
pnpm cron:update-polymarket-data
pnpm cron:batch-predictions -- --dry-run
pnpm cron:prediction-check -- --dry-run

# Test with curl (replace with your actual CRON_SECRET)
curl -X POST \
  -H "Authorization: Bearer your-secret-token" \
  -H "Content-Type: application/json" \
  https://your-domain.com/api/cron/update-polymarket-data
  https://your-domain.com/api/cron/generate-batch-predictions
  https://your-domain.com/api/cron/prediction-check
```

### Environment Variable Testing
```bash
# Check if CRON_SECRET is set
echo $CRON_SECRET

# Test with environment variable
CRON_SECRET=your-token pnpm cron:update-polymarket-data
```

## Monitoring
- Check your application logs for successful runs
- Monitor database for updated trending ranks
- Set up alerts for failed cron jobs

## Schedule Options

Common cron schedules:
- **Every hour**: `0 * * * *`
- **Every 6 hours**: `0 */6 * * *`
- **Every 12 hours**: `0 */12 * * *`
- **Daily at 2 AM**: `0 2 * * *`
- **Every 30 minutes**: `*/30 * * * *`

## Security Considerations

1. **Use strong CRON_SECRET**: Generate a secure random token
2. **HTTPS only**: Always use HTTPS in production
3. **Rate limiting**: Consider adding rate limiting to the endpoint
4. **Monitoring**: Set up alerts for failed cron jobs
5. **Logging**: Ensure proper logging for debugging

## Troubleshooting

### Common Issues:
1. **401 Unauthorized**: Check CRON_SECRET is set correctly in environment
2. **Connection refused**: Verify domain and port
3. **Timeout**: Check if the endpoint is taking too long
4. **Environment not loaded**: Ensure `.env.local` is in project root

### Debug Commands:
```bash
# Test endpoint directly
curl -v -X POST \
  -H "Authorization: Bearer your-secret-token" \
  https://your-domain.com/api/cron/update-trending

# Check environment variables
node -e "console.log('CRON_SECRET:', process.env.CRON_SECRET)"

# Test script with explicit environment
NODE_ENV=development DOMAIN=localhost:3000 npm run cron:update-trending
```

## Environment File Management

### For Development:
- Use `.env.local` for local development
- The script automatically loads from `.env.local`

### For Production:
- Set `CRON_SECRET` in your hosting platform's environment variables
- Vercel: Project Settings → Environment Variables
- Other platforms: Check their environment variable documentation

## Recommended Setup

- **Vercel**: Use Vercel cron jobs if deploying on Vercel
- **Node.js Script**: Use for local development or custom server setups

Both options leverage your existing environment configuration for seamless integration! 