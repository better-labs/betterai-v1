## RUNBOOK: Database Operations (BetterAI)

This runbook documents safe database operations for BetterAI across development, staging/preview, and production environments.


Environments recap:
Hosting: single Vercel project. 
Environment Variables: Env vars source of truth is Vercel.
Neon Database: Single Neon database. Branches used for preview and dev.
Dev+Preview and Production Privy instances.
Stripe: (future) Stripe Test keys for dev/preview, Live keys for prod
Update Runbook to document all of this minimally

Secrets management:
vercel env pull .env.local --environment=development
vercel env pull .env.preview --environment=preview
vercel env pull .env.production --environment=production