## Market Card UX Alignment Plan (incremental)

Context: The landing page market card is information-dense with inconsistent spacing. Align it to `lib/design-system.ts` for clear hierarchy, mobile-first layout, and predictable spacing.

### Phase 1 — Quick wins (low risk, 1–2 PRs)
- [ ] Normalize spacing and hierarchy in `features/market/MarketCard.client.tsx`
  - Replace ad‑hoc spacers with tokens: `spacing.card`, `spacing.heading`, `components.cardFooter.*`, `typography.*`
  - Header: event icon + question. Make question `typography.h3` and tighten header padding (`CardHeader` `pb-2`).
  - Metrics row: use a 2‑column responsive layout for `OutcomeStat` blocks (grid on md+, stacked on mobile).
  - Delta row: keep left `Stat` for AI Delta; right side shows collapsed reasoning preview.
  - CTA row: `Button` full‑width on mobile; external market link uses `components.cardFooter.link` styling.
- [ ] Use existing DS motion helpers for reasoning
  - Apply `components.motion.expandable.container` with `fadeOverlay` and Show More/Less chevron (use `components.disclosure.*`).
- [ ] Footer metadata
  - Use `components.cardFooter.layout.split` for the two lines (updated dates, end date + model).

Success criteria: visual rhythm matches DS, consistent margins, clear 5‑section structure (Header → Metrics → Delta/Reasoning → CTA → Meta).

Files to touch: `features/market/MarketCard.client.tsx`, `features/home/trending-markets.client.tsx` (grid spacing only).

---

### Phase 2 — Componentize + light DS additions (medium)
- [ ] Extract self‑contained sections for reuse
  - `features/market/market-card-sections.tsx` with: `MarketHeader`, `MarketMetrics`, `MarketDelta`, `MarketCTA`, `MarketMeta`.
  - Keep props typed with tRPC‑inferred types; no Prisma models in UI.
- [ ] Add minimal DS primitives to reduce custom classes
  - DS: `components.metrics = { row: 'grid grid-cols-1 md:grid-cols-2 gap-4', stat: 'min-w-0' }`
  - DS: `components.badge.delta = 'px-2 py-1 rounded text-xs font-medium bg-muted/50'` (used as optional delta chip)
  - DS: `components.cta.row = 'pt-2 space-y-3'` for consistent CTA block spacing.
- [ ] Replace hardcoded class strings in Market card with the above DS tokens.

Success criteria: Market card uses section components; class strings consolidated behind DS tokens; easier to reuse card layout elsewhere.

Files to touch: `features/market/MarketCard.client.tsx`, `features/market/market-card-sections.tsx` (new), `lib/design-system.ts` (add `components.metrics`, `components.badge.delta`, `components.cta.row`).

---

### Phase 3 — Mobile polish + interaction (optional polish)
- [ ] Mobile first refinements
  - Ensure metrics stack cleanly with consistent `gap-4`; ensure long questions wrap without layout shift (`whitespace-pre-wrap` in header title container).
  - Make Predict button sticky within card while expanding reasoning on small screens only if it doesn’t cause layout jump.
- [ ] Loading & accessibility
  - Use `components.loading.inline` in the CTA while generating predictions.
  - Ensure focus order and `aria-expanded` on the reasoning disclosure; verify tooltips announce via `aria-describedby`.
- [ ] Visual QA checklist
  - Baseline spacing: header 0.5rem below, section gaps 1rem–1.5rem per DS tokens.
  - Delta tones use `getDeltaTone` and DS badge color tokens.

Files to touch: `features/market/MarketCard.client.tsx`, `lib/design-system.ts` (if sticky CTA token added later).

---

Notes
- Keep edits small per PR: Phase 1 first; Phase 2 extraction next; Phase 3 polish last.
- Favor DS tokens over custom CSS; if a token is missing, add it once to `lib/design-system.ts` and reuse.


