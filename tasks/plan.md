# Implementation Plan: GetFunnels SaaS V1

> Derived from `docs/spec.md`. Task-level detail lives in `tasks/todo.md`. No implementation starts before the spec and this plan are approved.

## Overview

Build a multi-tenant SaaS on Next.js where users generate themed sales decks from pasted scripts, edit them, and present them live with a synced audience view. V1 runs on Supabase + Vercel, with all vendor touchpoints behind interfaces so V2 can move to a VPS with self-hosted Postgres.

## Architecture Decisions (summary — full list in `docs/architecture.md`)

1. Next.js App Router replaces the Vite SPA; marketing + app in one framework.
2. Supabase for V1 Postgres/Auth/Storage/Realtime; Drizzle ORM for portable SQL.
3. Slides are validated JSON rendered through a registry — never generated components.
4. Server-side-only AI behind an `AIProvider`; per-slide generation for cheap retries.
5. Org-scoped repositories + RLS; server-first data access.
6. Token-based public audience links replace the legacy password gate.
7. Stripe subscriptions + credit ledger in V1.
8. French-first UI, i18n-ready.

## Dependency Graph

```
Scaffold + tooling + env + tests
      │
      ├── Drizzle schema ── RLS ── Auth ── Orgs/onboarding ── App shell/tokens
      │                                                        │
      │        ┌───────────────────────────────────────────────┘
      │        ▼
      │   Slide schema ── Theme schema ── Renderer shell ── Renderer components
      │        │                                                │
      │        ├── Deck/slide repositories + services ── Dashboard ── Editor
      │        │                                                │
      │        └── Templates (port legacy decks) ───────────────┤
      │                                                         │
      │                        Presenter view ◄─────────────────┤
      │                        Audience view + token ◄──────────┤
      │                        Realtime provider ◄──────────────┘
      │                                │
      │                        AI provider + prompts + pipeline + wizard
      │                                │
      │                        Credits ── Stripe ── Marketing ── E2E ── V2 rehearsal
```

Implementation order is bottom-up; each phase ends in a working, demoable state.

## Phases & Checkpoints

### Phase 0 — Foundation
Scaffold, tooling, CI, env validation, test harness, Drizzle + first migrations, RLS helpers, auth, org onboarding, design tokens, app shell.

**Checkpoint A:** a user can sign up, create an org, land in an empty dashboard; `lint/typecheck/test/build` green in CI.

### Phase 1 — Content Core (data-driven decks)
Slide/theme schemas, renderer + component registry, theme seeds, deck CRUD, dashboard, editor, legacy template port, presenter view, audience view, realtime sync, PDF export.

**Checkpoint B:** a seeded template can be opened in the editor, presented live, and followed on a second machine via the public audience link — no AI involved.

### Phase 2 — AI Generation
Provider interface + Anthropic implementation, three pipeline stages, generation service with credits, API route with progress, wizard UI, per-slide regenerate, eval fixtures, plan limits.

**Checkpoint C:** paste a script → schema-valid themed deck in the editor; credits deducted; failures refunded; eval fixtures pass in CI.

### Phase 3 — SaaS Surface
Stripe checkout + webhook + subscriptions, billing UI + gating, marketing landing + pricing, analytics/monitoring/rate limits, e2e happy path, light mode + a11y pass.

**Checkpoint D:** a new user can pay, generate, present, and be limited correctly by plan; e2e green in CI.

### Phase 4 — Hardening & V2 Rehearsal
Run the whole stack against a plain Postgres container; fix and document every gap; sync docs; launch checklist.

**Checkpoint E:** `docker compose up` runs migrations + app on vanilla Postgres; gaps documented in `docs/architecture.md` migration table; launch checklist complete.

### Phase 5 — Premium Redesign (product chrome)
Restyle every app surface to a refined-dark, premium look. **No new business features** beyond a ⌘K command palette and a sidebar credits meter; slide renderers and deck themes are out of scope.

**Why:** an audit (2026-10-04) found ~450 raw palette classes (`zinc-*`, `violet-*`, `bg-white/[0.02]`, inline `rgba()` shadows) across 40 UI files versus 3 token usages; Inter is declared but never loaded; only 4 shadcn primitives exist (no Input, Dialog, Card, Tabs, Badge, Select); the shell has layout bugs (double left padding, fixed 256 px sidebar on mobile, collapse not reflowing content, dead bell + light-mode toggle).

**Direction (decided):**
- Refined dark, Linear/Vercel register: near-black neutrals, hairline borders, depth from surface steps not glows, no gradient text, no decorative blur blobs.
- Chrome uses a tuned violet scale with ≥ 4.5:1 white-on-primary; deck themes keep `#470C85` untouched.
- Violet is reserved for primary actions, focus, and selection — everything else is neutral.
- Geist + Geist Mono via `next/font` (no new dependency); replaces the never-loaded Inter.
- Approved dependencies: Radix primitives via shadcn, `framer-motion`, `sonner`, `cmdk`.

**Order:** tokens/fonts/guardrail → primitives → shared patterns → shell + ⌘K → dashboard/templates → wizard → editor → presenter/audience → settings/billing → auth/onboarding → marketing → QA pass.

**Approach to shadcn "do not fork":** map shadcn's CSS variables (`--background`, `--primary`, `--ring`, …) to our product tokens in `globals.css`, so primitives are themed without editing their source.

**Checkpoint F:** tokens, primitives, and shell approved from screenshots at 1440×900 and 390×844.
**Checkpoint G:** dashboard, wizard, editor, presenter, and audience redesigned; e2e green.
**Checkpoint H:** every surface redesigned; zero raw palette classes outside `slides/`; axe + contrast + Lighthouse pass.

### Phase 6 — Legacy integration (`get-funnel-go` → v2)
Bring everything of value from the legacy app into v2. The legacy repo is a read-only source (spec decision 12); content and designs are rebuilt as slide data, slide types, themes and presenter features (decision 9).

**Why:** an analysis (2026-10-08) found v2 ships 4 of 7 legacy decks (Commercial 20/44 slides, Webinaire 20/24), none of the legacy visual language (glows, grids, glass cards, gradient headlines, direction-aware transitions, animated diagrams), no embed/screenshot/gauge mechanics, and a flatter presenter script than the legacy `{punchline, timing, tag, transition, bullets}`. Not ported on purpose: Base44, the hard-coded password gate, 1.5 s polling sync, ~15 unused deps, and known legacy bugs.

**Order:** quick fixes (seed + icons) → missing deck content → private GetFunnels org → Signature design kit → layout variants → new slide types + illustration library → structured presenter scripts.

**Scope note:** unlike Phase 5, this phase *does* change slide renderers and deck themes. Phase 5's "no blur blobs / no gradient text" rule applies to product chrome only; the Signature kit uses them inside slides.

**Checkpoint I:** all 7 legacy decks available as templates (structure-faithful, placeholders for agency content); GetFunnels org holds the full-fidelity decks; Signature kit + new types approved from screenshots against the legacy decks.

## Task Sizing

Per `planning-and-task-breakdown` conventions: no task exceeds ~5 files or one focused session. Renderer work is split into three batches; SaaS surface tasks are independent and parallelizable after Checkpoint C prerequisites.

## Parallelization

| Can run in parallel | Must be sequential |
|---|---|
| Renderer component batches (after schema lands) | Migrations chain |
| Marketing pages vs billing UI | Auth → orgs → app shell |
| Theme seeds vs dashboard UI | Pipeline stages (brief → plan → slides) |
| E2E specs vs analytics wiring | Credits service → Stripe gating |

Contract-first rule: before parallel work on any shared boundary (slide schema, theme tokens, repository signatures), freeze the interface in the relevant doc and code, then split.

## Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Slide schema churn after renderer work starts | High | Freeze schema after Task 9 review; changes require doc update + migration note |
| AI output quality in French | High | Template constraints + per-field limits + eval fixtures; per-slide regenerate as UX escape hatch |
| Editor scope creep | High | V1 editor = text fields, reorder, add/remove, theme switch. No drag-and-drop freeform layout |
| Supabase lock-in drift | Medium | Interfaces for Auth/Realtime/Storage; plain-SQL migrations; Phase 4 rehearsal as an enforced gate |
| Legacy content porting effort underestimated | Medium | Port 4 decks first (spec Q8); the rest are copy-paste JSON with review |
| Realtime reliability on restricted networks | Medium | Polling fallback behind a flag |
| Credit/billing bugs | High | Server-side enforcement only; idempotent webhooks; integration tests on the credit service |
| Vercel-only APIs sneaking into services | Medium | Boundary rules in `AGENTS.md`; review checklist item |
| Redesign breaks e2e selectors | Medium | Keep every `data-testid` and accessible name; the one native-`select` locator is updated in the same task that swaps it |
| Redesign drifts into feature work | Medium | Phase 5 tasks restyle and restructure only; any new behavior needs a todo entry first |
| Raw palette classes creep back in | Medium | Task 40 adds a test that fails on raw palette classes / hex outside `src/components/slides/` |

### Checkpoint E (Launch)
- [x] `docker compose up` runs migrations + app on vanilla Postgres
- [x] Gaps documented in `docs/architecture.md` migration table
- [x] Launch checklist complete

## Resolved Questions

| # | Question | Blocks | Resolution |
|---|---|---|---|
| 1 | Pricing, plans, credit amounts | Phase 3 (Tasks 31–32) | Free, Pro, Agency implemented |
| 2 | Which 4 legacy decks ship as system templates | Task 19 | All 7 legacy frameworks + 2 v2-authored extras (Phase 6, Tasks 53–56) |
| 3 | Light mode required at launch? | Task 36 | Deferred/not critical |
| 4 | Lead capture before audience viewing (V1.5?) | Phase 1 audience view design | Deferred |
| 5 | Redesign visual direction | Phase 5 | Refined dark (Linear/Vercel register) |
| 6 | Brand purple in product chrome | Task 40 | Tuned violet scale in chrome; `#470C85` stays in deck themes |
| 7 | Redesign dependencies | Task 41 | Approved: Radix via shadcn, framer-motion, sonner, cmdk |
| 8 | Redesign sequencing | Phase 5 | Foundation first, then all surfaces, marketing last |
| 9 | How legacy designs are integrated | Phase 6 | Rebuilt in the data-driven system (editable), not copied |
| 10 | Agency content in templates | Phase 6 (Tasks 53–57) | Placeholders in system templates; full decks in a private GetFunnels org |
| 11 | Third-party embeds | Phase 6 (Task 60) | Allowed: sandboxed iframe + domain allow-list |
