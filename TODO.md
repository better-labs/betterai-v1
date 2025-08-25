maint: clean up remaining components

The following plan is to move the current contents of /components directory to /shared or /features per our current design system.

File-by-file moves

Note: add the suffix "*.client.tsx" if the code contains "use client" to indicate it is client only code.

Domain = prediction

prediction-engine-panel.tsx → features/prediction/

recent-predictions.tsx → features/prediction/

paginated-recent-predictions.tsx → features/prediction/

ai-vs-human-accuracy-chart.tsx → shared/ui/marketing/

Domain = events (new)

event-list.tsx → features/events/

event-icon.tsx → shared/ui/icons/

Domain = discovery/browse (tags, trending)

popular-tags-list.tsx → shared/ui/discovery/

tag-filter.tsx → shared/ui/discovery/

trending-selector.tsx → shared/ui/discovery/

Domain = user / auth / analytics

beta-signup-form.tsx → features/user/

privy-client-provider.tsx → shared/providers/auth/

PostHogProvider.tsx → shared/providers/analytics/

welcome-banner.tsx →features/user/

Marketing / landing

landing-page.tsx → shared/layout/

home-page-wrapper.tsx → shared/layout/

Layout / navigation / theming / transitions

header.tsx → shared/layout/

footer.tsx → shared/layout/

theme-toggle.tsx → shared/ui/theme/

page-transition.tsx → shared/ui/transitions/

Charts / UI primitives

sparkline.tsx → shared/ui/charts/

Lists for markets (if they exist)

If recent-predictions.tsx / paginated-* actually display markets, place in features/market/* instead of prediction. Pick one and be consistent.

Docs folder

components/docs/* → features/docs/

README.md (in components)

Move notes into a section of your main repo README.md or delete once migration is done.

3-Phase Migration Plan (with tests)

Phase 1 — Stand up structure & move shared pieces (low risk)

Move now:

header.tsx, footer.tsx → shared/layout/*

theme-toggle.tsx, page-transition.tsx, sparkline.tsx → shared/ui/*

cta-section.tsx, welcome-banner.tsx (if marketing), blocks from landing-page.tsx → shared/ui/marketing/*

Providers: PostHogProvider.tsx, privy-client-provider.tsx → shared/providers/*

Client/Server hygiene:

Add .client.tsx where interactive.

Ensure no server deps in *.client.tsx.

Temporary alias (optional, short-lived):

// tsconfig.json
{ "compilerOptions": { "baseUrl": ".", "paths": {
  "@/components/*": ["shared/*"], "@/*": ["*"]
}}}


Tests/Gates:

Unit/type/lint/build:

pnpm test

pnpm tsc --noEmit

pnpm eslint .

pnpm next build

Quick UI smoke (Playwright or Cypress, pick one):

Load home, toggle theme, check header/footer render.

Fix paths, then commit.

Phase 2 — Move domain components (prediction, events, discovery)

Create domains:

features/prediction/, features/events/, features/discovery/ (or features/market/ if that’s the home for tags/trending)

Move now:

Prediction: prediction-engine-panel.tsx, recent-predictions.tsx, paginated-recent-predictions.tsx, ai-vs-human-accuracy-chart.tsx (choose features/... vs shared/ui/charts as noted).

Events: event-list.tsx, event-icon.tsx (or shared icon).

Discovery: popular-tags-list.tsx, tag-filter.tsx, trending-selector.tsx.

Client/Server hygiene:

Make lists RSC by default; wrap interactivity in .client.tsx.

Data fetching in RSC / server modules (import 'server-only' in features/*/server/* as needed).

Tests/Gates:

Unit tests for domain pieces (render smoke + prop contracts).

E2E:

Prediction list renders; pagination works.

Tag filter changes results.

Events list shows correct count.

pnpm tsc --noEmit → fix any cross-feature imports.

pnpm next build → ensure no server code leaks into clients.

Phase 3 — Clean up, delete /components, lock it down

Do:

If landing-page.tsx is still a monolith, split it into app/(marketing)/page.tsx + blocks in shared/ui/marketing/*.

Remove the temporary @/components/* path alias.

Delete /components directory.

Enforce:

ESLint guardrails:

// .eslintrc.js
module.exports = {
  rules: {
    'no-restricted-imports': ['error', { patterns: ['@/components/*'] }]
  },
  overrides: [
    {
      files: ['**/*.client.tsx'],
      rules: {
        'no-restricted-imports': ['error', {
          patterns: ['@/lib/server/*','@/features/**/server/*','@prisma/client']
        }]
      }
    }
  ]
}


Final test sweep:

pnpm test && pnpm tsc --noEmit && pnpm eslint . && pnpm next build

E2E smoke across critical flows (home → browse → prediction detail).

Lighthouse (or Next analytics) quick pass: no obvious regressions.

Notes on “gray area” components

If something mixes marketing and app logic, split it: presentation to shared/ui/marketing/*, data & wiring to an app route or a tiny domain wrapper in features/*.

If you can’t cleanly justify “shared” or “feature,” it’s probably feature. “Shared” should be a curated design system, not a convenient bucket.

Bottom line: move anything with business meaning into a feature; everything else into a curated shared/ with strict review. Then nuke /components.