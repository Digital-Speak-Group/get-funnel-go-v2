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

## Open Questions (blocking specific phases)

| # | Question | Blocks |
|---|---|---|
| 1 | Pricing, plans, credit amounts | Phase 3 (Tasks 31–32) |
| 2 | Which 4 legacy decks ship as system templates | Task 19 |
| 3 | Light mode required at launch? | Task 36 |
| 4 | Lead capture before audience viewing (V1.5?) | Phase 1 audience view design |

Resolve each by updating `docs/spec.md` → Open Questions, then this plan.
