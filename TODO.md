## Market Card UX Alignment Plan (incremental)

Context: The landing page market card is information-dense with inconsistent spacing. Align it to `lib/design-system.ts` for clear hierarchy, mobile-first layout, and predictable spacing.

### Phase 1 — Use existing DS tokens (low risk, 1 PR)
- [ ] Normalize spacing and hierarchy in `features/market/MarketCard.client.tsx`
  - Card container: `components.card.base` + `components.card.hover` for base styling
  - Replace ad‑hoc spacers with existing tokens: `spacing.card`, `spacing.heading`, `spacing.cta`
  - Header: event icon + question. Use `typography.h3` for question, tighten with existing padding tokens
  - Metrics row: `layout.grid.cols['2']` + `layout.grid.gap.md` for responsive OutcomeStat blocks
  - Use `typography.outcomeValue` and `typography.outcomeLabel` for metric styling
  - Delta row: keep left `Stat` for AI Delta; right side shows collapsed reasoning preview
  - CTA row: `Button` full‑width on mobile; external market link uses `components.cardFooter.link` styling
- [ ] Use existing DS motion helpers for reasoning
  - Apply `components.motion.expandable.container` with `fadeOverlay` and Show More/Less chevron (use `components.disclosure.*`)
- [ ] Footer metadata
  - Use `components.cardFooter.layout.split` for the two lines (updated dates, end date + model)

Success criteria: visual rhythm matches DS, consistent margins, clear 5‑section structure (Header → Metrics → Delta/Reasoning → CTA → Meta).

Files to touch: `features/market/MarketCard.client.tsx`, `features/home/trending-markets.client.tsx` (grid spacing only).

---

### Phase 2 — Componentize + minimal DS additions (medium)
- [ ] Extract self‑contained sections for reuse
  - `features/market/market-card-sections.tsx` with: `MarketHeader`, `MarketMetrics`, `MarketDelta`, `MarketCTA`, `MarketMeta`
  - Keep props typed with tRPC‑inferred types; no Prisma models in UI
- [ ] Add only necessary DS tokens (avoid duplicating existing patterns)
  - DS: `components.badge.delta = 'px-2 py-1 rounded text-xs font-medium bg-muted/50'` (genuinely new pattern)
  - Evaluate if `components.metrics.stat = 'min-w-0'` is needed beyond existing `layout.grid.*` patterns
- [ ] Replace remaining hardcoded class strings with DS tokens

Success criteria: Market card uses section components; minimal new DS additions; easier to reuse card layout elsewhere.

Files to touch: `features/market/MarketCard.client.tsx`, `features/market/market-card-sections.tsx` (new), `lib/design-system.ts` (add `components.badge.delta` only if needed).

---

### Phase 3 — Mobile polish + accessibility (optional polish)
- [ ] Mobile first refinements
  - Ensure metrics stack cleanly using existing `layout.grid.gap.md`; long questions wrap without layout shift
  - Consider sticky Predict button only if no layout jump (avoid new DS tokens unless necessary)
- [ ] Loading & accessibility (leverage existing patterns)
  - Use existing `components.loading.inline` in the CTA while generating predictions
  - Ensure focus order and `aria-expanded` on the reasoning disclosure; verify tooltips announce via `aria-describedby`
- [ ] Visual QA checklist
  - Validate spacing matches DS tokens: `spacing.heading`, `spacing.cta`, `spacing.card`
  - Delta tones use existing badge patterns from DS (avoid `getDeltaTone` complexity if possible)

Files to touch: `features/market/MarketCard.client.tsx` (no new DS additions expected).

---

## Key Changes Applied
- **Phase 1**: Prioritize existing DS tokens (`components.card.*`, `layout.grid.*`, `typography.outcome*`)
- **Phase 2**: Minimal DS additions - only `components.badge.delta` if truly needed
- **Phase 3**: Leverage existing patterns (`components.loading.inline`) rather than custom solutions
- **Overall**: Reduced complexity by reusing 80%+ of existing DS tokens before adding new ones

Notes
- Keep edits small per PR: Phase 1 first; Phase 2 extraction next; Phase 3 polish last
- Exhaust existing DS tokens before adding new ones - simpler maintenance and consistency


