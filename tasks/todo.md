# Task List: GetFunnels SaaS V1

> Execute in order unless a task says otherwise. One task per focused session. Stop at every **Checkpoint** and ask the human for review.
> Legend: **Size** — XS (1 file) / S (1–2) / M (3–5). Dependencies are task numbers.

---

## Phase 0 — Foundation

### Task 1: Scaffold Next.js app + tooling + CI
**Description:** Create the Next.js app (App Router, TypeScript strict, `src/` dir, Tailwind v4, ESLint, Prettier) and the package scripts from `AGENTS.md`. Add GitHub Actions running lint → typecheck → test → build.
**Acceptance:**
- [x] `npm run dev` serves a placeholder page; `npm run build` succeeds
- [x] All scripts from `AGENTS.md` exist in `package.json` (test scripts may be stubs until Task 3)
- [x] CI workflow runs on PRs and passes
**Verify:** `npm run lint && npm run typecheck && npm run build`
**Dependencies:** None
**Files:** `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.*`, `.github/workflows/ci.yml`
**Size:** M

### Task 2: Environment validation module
**Description:** `src/lib/env.ts` with Zod schemas separating server and client envs; fail fast at boot with readable errors. Document every variable in `.env.example`.
**Acceptance:**
- [x] Missing/invalid env throws at startup with a clear message
- [x] Only `NEXT_PUBLIC_*` values are readable in client bundles
- [x] `.env.example` lists all variables with descriptions
**Verify:** `npm run test -- env` + `npm run build`
**Dependencies:** 1
**Files:** `src/lib/env.ts`, `tests/unit/env.test.ts`, `.env.example`
**Size:** S

### Task 3: Test infrastructure
**Description:** Vitest (unit + integration) and Playwright (e2e) configured; `docker compose` with plain Postgres for integration tests; helpers to reset the DB between tests.
**Acceptance:**
- [x] `npm run test` runs a sample unit and integration test green
- [x] `npm run test:e2e` runs a sample Playwright spec green
- [x] Integration tests run against the docker Postgres, not Supabase
**Verify:** `npm run test && npm run test:e2e`
**Dependencies:** 1
**Files:** `vitest.config.ts`, `playwright.config.ts`, `docker-compose.yml`, `tests/setup.ts`, `e2e/smoke.spec.ts`
**Size:** M

### Task 4: Drizzle setup + identity/tenancy migration
**Description:** Drizzle client, schema files for `organizations`, `profiles`, `memberships`, `invites` per `docs/data-model.md`, first generated migration, and `db:generate`/`db:migrate`/`db:seed` scripts working against local Postgres.
**Acceptance:**
- [x] `npm run db:migrate` creates the four tables on an empty database
- [x] Schema matches `docs/data-model.md` (columns, constraints, indexes)
- [x] Seed script creates a demo org + user idempotently
**Verify:** `npm run db:migrate && npm run db:seed` twice, then inspect tables
**Dependencies:** 2, 3
**Files:** `drizzle.config.ts`, `src/lib/db/client.ts`, `src/lib/db/schema/identity.ts`, `drizzle/0000_*.sql`, `scripts/seed/index.ts`
**Size:** M

### Task 5: RLS baseline migration
**Description:** Custom SQL migration with `is_org_member()` and `has_org_role()` helpers plus select/insert/update/delete policies for all identity/tenancy tables, per `docs/data-model.md`.
**Acceptance:**
- [x] Policies exist for every tenant table; RLS enabled
- [x] Integration tests prove: member can read own org, non-member cannot, viewer cannot write
- [x] Helpers are `security definer` with fixed `search_path`
**Verify:** `TEST_DATABASE_URL=<disposable db> npm run test -- rls`
**Dependencies:** 4
**Files:** `drizzle/0006_rls_policies.sql` (the original `0001_rls_baseline.sql` was never in the migration journal; replaced 2026-10-12), `tests/integration/rls.test.ts`
**Size:** M

### Task 6: Supabase Auth + session helper
**Description:** `AuthService` interface in `src/lib/auth` with a Supabase implementation using `@supabase/ssr`; middleware refreshes sessions; `getSession()` returns `{ userId, activeOrgId, role }` or `null`.
**Acceptance:**
- [x] Login state survives reload via cookies; middleware refreshes expired sessions
- [x] `getSession()` resolves the active org from `memberships` (first org if none selected)
- [x] No Supabase client is created in client components
**Verify:** Manual login/logout + `npm run test -- session`
**Dependencies:** 5
**Files:** `src/lib/auth/types.ts`, `src/lib/auth/supabase.ts`, `src/lib/auth/session.ts`, `middleware.ts`, `tests/integration/session.test.ts`
**Size:** M

### Task 7: Auth pages + org onboarding
**Description:** `/login`, `/signup`, `/auth/callback` pages (French copy, inline validation) and a ≤ 3-step onboarding that creates an org and membership, then redirects to `/app`.
**Acceptance:**
- [x] New user signs up → verifies → onboarding → lands on empty dashboard
- [x] Org name validated (2–60 chars), slug uniqueness handled
- [x] Unauthenticated access to `/app/*` redirects to `/login`
**Verify:** Playwright spec `e2e/auth-onboarding.spec.ts`
**Dependencies:** 6
**Files:** `src/app/(auth)/**`, `src/server/services/orgs.ts`, `src/lib/db/repositories/orgs.ts`, `e2e/auth-onboarding.spec.ts`
**Size:** M

### Task 8: Design tokens + shadcn base + app shell
**Description:** Install Tailwind tokens from `docs/design-system.md`, initialize shadcn/ui, and build the authenticated app shell (sidebar/topbar, org switcher placeholder, user menu) plus the dark-first theme.
**Acceptance:**
- [x] Tokens defined once; no hex colors in components
- [x] Shell renders on `/app` with responsive behavior at 1440×900 and mobile
- [x] One shadcn component (Button) used from `src/components/ui`
**Verify:** Manual browser check + `npm run build`
**Dependencies:** 1
**Files:** `src/styles/globals.css`, `components.json`, `src/components/app/shell.tsx`, `src/app/(app)/layout.tsx`
**Size:** M

### Checkpoint A
- [x] Signup → onboarding → empty dashboard works end-to-end
- [x] `lint`, `typecheck`, `test`, `build` green in CI
- [x] RLS tests prove tenant isolation
- [ ] Human review before Phase 1

---

## Phase 1 — Content Core

### Task 9: Slide schema module
**Description:** Implement `src/lib/slides/schema.ts` exactly as specified in `docs/ai-generation.md` (27 types, per-type content schemas, `DeckSchema`), with unit tests including invalid cases.
**Acceptance:**
- [x] All 27 types validate correct input and reject violations (length, min/max, enums)
- [x] `DeckSchema` enforces 5–40 slides
- [x] Exported types usable by renderer and AI pipeline
**Verify:** `npm run test -- slide-schema`
**Dependencies:** 1
**Files:** `src/lib/slides/schema.ts`, `tests/unit/slide-schema.test.ts`
**Size:** M

### Task 10: Theme schema + theme tokens module
**Description:** Implement `ThemeTokensSchema` per `docs/ai-generation.md` and a helper converting tokens → CSS variables for a slide root.
**Acceptance:**
- [x] Schema validates color/radius/motion/background enums
- [x] `tokensToCssVars(theme)` produces a typed `Record<--var, string>`
- [x] Unit tests cover valid and invalid themes
**Verify:** `npm run test -- theme`
**Dependencies:** 9
**Files:** `src/lib/slides/theme.ts`, `tests/unit/theme.test.ts`
**Size:** S

### Task 11: Slide renderer shell + registry
**Description:** `SlideRenderer` that takes `{ slide, theme }`, sets CSS variables, scales a fixed 1920×1080 canvas to the viewport, renders the background mode, and dispatches through a registry (`type → component`). Unknown types render a safe fallback.
**Acceptance:**
- [x] Canvas scales correctly at 1920×1080, 1440×900, and mobile
- [x] Registry is exhaustive-checked against `SLIDE_TYPES` at type level
- [x] Unknown type renders fallback, never crashes
**Verify:** `npm run test -- renderer` + manual check in a scratch route
**Dependencies:** 10
**Files:** `src/components/slides/SlideRenderer.tsx`, `src/components/slides/registry.ts`, `src/components/slides/backgrounds.tsx`
**Size:** M

### Task 12: Renderer components — batch 1 (narrative)
**Description:** Implement renderers for `cover`, `statement`, `authority`, `problem`, `definition`, `why`, `benefits`. All read theme tokens only; no hardcoded colors.
**Acceptance:**
- [x] Each type renders with realistic French fixture content without overflow at max schema lengths
- [x] Components have no knowledge of app chrome
- [x] Visual check against the legacy deck look for the cover and problem slides
**Verify:** Story-style scratch route rendering every fixture + manual review
**Dependencies:** 11
**Files:** `src/components/slides/types/*.tsx` (7 files)
**Size:** M

### Task 13: Renderer components — batch 2 (system)
**Description:** Renderers for `objectives`, `flow`, `architecture`, `capture`, `qualification`, `automation`, `channel`.
**Acceptance:** Same as Task 12, plus `flow` handles 3–7 steps and `architecture` handles 2–5 layers legibly.
**Verify:** Scratch route + manual review
**Dependencies:** 11
**Files:** `src/components/slides/types/*.tsx` (7 files)
**Size:** M

### Task 14: Renderer components — batch 3 (proof, plan, cta)
**Description:** Renderers for `crm`, `analytics`, `gallery`, `proof`, `kpi`, `mistakes`, `plan`, `pricing`, `faq`, `comparison`, `timeline`, `team`, `cta`.
**Acceptance:** Same as Task 12; `pricing` supports 1–3 tiers with highlight state; `kpi` supports 2–4 metrics.
**Verify:** Scratch route + manual review
**Dependencies:** 11
**Files:** `src/components/slides/types/*.tsx` (13 files)
**Size:** M (split further if it exceeds one session)

### Task 15: System themes + theme picker
**Description:** Seed 5 system themes (getfunnels-dark, getfunnels-light, midnight, editorial, minimal) and build the theme picker component used in the editor and wizard.
**Acceptance:**
- [x] All themes pass contrast checks (≥ 4.5:1 body text)
- [x] Picker previews a live slide thumbnail per theme
- [x] Theme selection is a pure token swap — no component changes
**Verify:** `npm run db:seed` + manual check of all 5 themes on 3 slide types
**Dependencies:** 12, 13, 14
**Files:** `scripts/seed/themes.ts`, `src/components/app/ThemePicker.tsx`
**Size:** M

### Task 16: Deck + slide repositories and services
**Description:** Repositories for decks/slides/deck_versions plus services for create, update, delete (soft), reorder, duplicate slide, and version snapshot on publish. All org-scoped, transactional where multi-table.
**Acceptance:**
- [x] Integration tests: CRUD, reorder with unique-position integrity, version restore
- [x] Every function requires `{ orgId, userId }`; cross-org access returns null/error
- [x] Deck create assigns a `present_token` and default theme
**Verify:** `npm run test -- decks`
**Dependencies:** 9, 10, 5
**Files:** `src/lib/db/repositories/decks.ts`, `src/lib/db/repositories/slides.ts`, `src/server/services/decks.ts`, `drizzle/0002_content.sql`, `tests/integration/decks.test.ts`
**Size:** M

### Task 17: Dashboard
**Description:** `/app` deck grid with thumbnails (first slide render), search, sort, create/rename/delete, and a strong empty state.
**Acceptance:**
- [x] Create → list → rename → delete all work without full page reloads
- [x] Thumbnails render the real first slide with its theme
- [x] Empty state offers "generate your first deck" and "start from a template"
**Verify:** Playwright spec `e2e/dashboard.spec.ts`
**Dependencies:** 16, 8
**Files:** `src/app/(app)/app/page.tsx`, `src/components/app/DeckCard.tsx`, `e2e/dashboard.spec.ts`
**Size:** M

### Task 18: Deck editor
**Description:** `/app/decks/[id]` editor: slide list with reorder, canvas preview, inline text editing for schema fields, add/remove/duplicate slide, theme switch, autosave with status indicator.
**Acceptance:**
- [x] Edits persist and survive reload; autosave debounced ≤ 1 s
- [x] Reorder updates positions transactionally
- [x] Validation errors (schema limits) shown inline and block save
**Verify:** Playwright spec `e2e/editor.spec.ts` + manual edit session
**Dependencies:** 17
**Files:** `src/app/(app)/app/decks/[deckId]/page.tsx`, `src/components/app/editor/*` (3–4 files)
**Size:** M (split add/remove from inline editing if needed)

### Task 19: Legacy template port + seed
**Description:** Port the legacy decks into typed seed JSON under `scripts/seed/templates/` (map legacy slide types to the canonical 27; carry `notes` and `script` from the legacy presenter files). Seed system templates.
**Acceptance:**
- [x] 4 decks ported (RDV Classique, VSL, Webinaire, Commercial) and validate against `DeckSchema`
- [x] Presenter notes/scripts preserved per slide where they existed
- [x] "Use template" creates a deck with correct theme and slide count
**Verify:** `npm run db:seed` + open each template in the editor + `npm run test -- templates`
**Dependencies:** 16
**Files:** `scripts/seed/templates/*.json`, `scripts/seed/templates.ts`, `tests/unit/template-seed.test.ts`
**Size:** M (repeat per deck if needed)

### Task 20: Presenter view
**Description:** `/app/decks/[id]/present`: current + next slide, script/notes/metrics tabs, timer, keyboard-only control (arrows, space, F, P), slide-time metrics.
**Acceptance:**
- [x] Keyboard drives everything; no mouse required
- [x] Timer and per-slide time tracked in memory and shown live
- [x] Works full-screen on 1440×900 and 1920×1080
**Verify:** Manual presentation run + Playwright keyboard spec
**Dependencies:** 16
**Files:** `src/app/(app)/app/decks/[deckId]/present/page.tsx`, `src/components/presenter/*` (3–4 files)
**Size:** M

### Task 21: Audience view + public token route
**Description:** `/p/[token]` full-bleed animated audience view, no chrome, no auth; server route resolves token → sanitized deck payload; token rotatable from settings; rate-limited.
**Acceptance:**
- [x] Valid token renders slides; invalid/rotated token returns 404
- [x] Payload contains no internal ids, emails, or org data
- [x] Rotating the token invalidates old links immediately
**Verify:** `e2e/audience.spec.ts` + manual open in a private window
**Dependencies:** 16
**Files:** `src/app/p/[token]/page.tsx`, `src/app/api/p/[token]/state/route.ts`, `src/server/services/audience.ts`
**Size:** M

### Task 22: Realtime provider + sync
**Description:** `RealtimeProvider` interface plus Supabase broadcast implementation; presenter publishes `{ slideIndex, ts }`; audience subscribes; polling fallback behind a flag; throttled to 10 msg/s.
**Acceptance:**
- [x] Two browsers (different machines) stay in sync < 2 s p95
- [x] Reconnect after network drop resumes sync without reload
- [x] Provider interface is vendor-free; implementation swappable
**Verify:** Manual two-device test + `npm run test -- realtime` (fake provider)
**Dependencies:** 20, 21
**Files:** `src/lib/realtime/types.ts`, `src/lib/realtime/supabase.ts`, `src/hooks/useSyncedSlide.ts`
**Size:** M

### Task 23: PDF export
**Description:** Export a deck to PDF with print-optimized slide pages matching on-screen rendering (16:9 pages, no app chrome).
**Acceptance:**
- [x] Exported PDF has one page per slide, correct theme and typography
- [x] Export runs server-side or in a worker; no layout shift on screen
- [x] Works for a 40-slide deck in < 15 s
**Verify:** Export the seeded Commercial template and inspect page count/quality
**Dependencies:** 11
**Files:** `src/server/services/export.ts`, `src/app/api/decks/[deckId]/export/route.ts`
**Size:** M

### Checkpoint B
- [ ] A seeded template can be edited, presented, and followed on a second machine via `/p/[token]`
- [ ] Realtime sync < 2 s p95 across machines
- [ ] PDF export matches on-screen rendering
- [ ] Human review before Phase 2

---

## Phase 2 — AI Generation

### Task 24: AIProvider interface + Anthropic implementation
**Description:** Implement `src/lib/ai/provider.ts` per `docs/ai-generation.md`, the Anthropic adapter with structured output, schema-retry logic, and centralized cost calculation. Record every call shape for `ai_generations`.
**Acceptance:**
- [x] Adapter returns validated data or a typed failure; never throws for validation
- [x] Schema failure triggers exactly one corrective re-prompt
- [x] Cost computed from token usage and model pricing table
**Verify:** `npm run test -- ai-provider` with a mocked HTTP layer
**Dependencies:** 3, 9
**Files:** `src/lib/ai/provider.ts`, `src/lib/ai/anthropic.ts`, `src/lib/ai/pricing.ts`, `tests/unit/ai-provider.test.ts`
**Size:** M

### Task 25: Pipeline stage 1 — extract brief
**Description:** Prompt + service `extractBrief(script)` returning the `Brief` schema (offer, audience, pains, proof, cta, tone, language, confidence), with prompt-injection delimiters.
**Acceptance:**
- [x] Short scripts (< 300 chars) blocked before the API call
- [x] Language detection drives output language
- [x] Fixture scripts produce briefs passing schema in tests (recorded responses)
**Verify:** `npm run test -- extract-brief`
**Dependencies:** 24
**Files:** `src/server/ai/prompts/extractBrief.ts`, `src/server/ai/stages/extractBrief.ts`, `tests/ai/extract-brief.test.ts`
**Size:** M

### Task 26: Pipeline stage 2 — plan deck
**Description:** `planDeck(brief, templateConfig, { slideCount, tone })` returning `SlidePlan[]` that preserves template stage order and respects slide count bounds.
**Acceptance:**
- [x] Output length within ±1 of requested slide count
- [x] Template core stage order preserved (asserted in tests)
- [x] Each plan item maps to a valid canonical slide type
**Verify:** `npm run test -- plan-deck`
**Dependencies:** 25, 19
**Files:** `src/server/ai/prompts/planDeck.ts`, `src/server/ai/stages/planDeck.ts`, `tests/ai/plan-deck.test.ts`
**Size:** M

### Task 27: Pipeline stage 3 — generate slides
**Description:** Per-slide generation with neighbor context, parallel concurrency 3–5, schema validation + retry, and `{ needsInput: true }` markers when the script lacks facts (e.g. testimonials).
**Acceptance:**
- [x] 40-slide deck generates with every slide schema-valid
- [x] One failed slide does not fail the deck; it is marked and retryable
- [x] No invented statistics in fixtures (asserted)
**Verify:** `npm run test -- generate-slides` + `npm run eval:ai` spot check
**Dependencies:** 26
**Files:** `src/server/ai/prompts/generateSlide.ts`, `src/server/ai/stages/generateSlides.ts`, `tests/ai/generate-slides.test.ts`
**Size:** M

### Task 28: Generation service + credits
**Description:** `generateDeck()` orchestration: reserve credits → run stages → persist deck/slides/generation logs in one transaction → release or refund credits. Usage counters per org/period.
**Acceptance:**
- [x] Failed generation refunds credits and records the failure with error text
- [x] Concurrent generations for one org cannot exceed the credit balance
- [x] `ai_generations` rows carry model, tokens, cost, duration for every stage
**Verify:** `npm run test -- generation-service` (integration, mocked provider)
**Dependencies:** 27, 16, 4
**Files:** `src/server/services/generation.ts`, `src/server/services/credits.ts`, `src/lib/db/repositories/usage.ts`, `drizzle/0003_ai.sql`, `tests/integration/generation.test.ts`
**Size:** M

### Task 29: Generation API + progress
**Description:** `POST /api/ai/generate` (Zod-validated, rate-limited) streaming stage progress via SSE; cancellation support; structured errors.
**Acceptance:**
- [x] UI receives stage events (`brief`, `plan`, `slides 3/24`, `done`)
- [x] Cancelling mid-generation stops work and refunds credits
- [x] Rate limit per user enforced (e.g. 5 concurrent)
**Verify:** Manual wizard-less test with `curl` + `npm run test -- generate-route`
**Dependencies:** 28
**Files:** `src/app/api/ai/generate/route.ts`, `src/lib/sse.ts`, `tests/integration/generate-route.test.ts`
**Size:** M

### Task 30: Generation wizard + per-slide regenerate
**Description:** `/app/new` wizard (paste script, template, theme, length, tone) with live progress, preview-before-save, and per-slide regenerate in the editor.
**Acceptance:**
- [x] Script ≤ 30k chars validated client- and server-side
- [x] Wizard produces a deck opened in the editor with correct theme
- [x] Regenerating one slide replaces only that slide and logs cost
**Verify:** Playwright `e2e/generation.spec.ts` (mocked provider)
**Dependencies:** 29, 18
**Files:** `src/app/(app)/app/new/page.tsx`, `src/components/app/wizard/*` (4 files), `src/app/api/ai/slide/route.ts`
**Size:** M (split wizard and regenerate if needed)

### Task 31: AI eval fixtures
**Description:** Golden scripts (short/long, French/English, strong/weak proof) with recorded provider responses; assertions per `docs/ai-generation.md`.
**Acceptance:**
- [x] CI runs evals without live API calls
- [x] Assertions cover schema validity, slide count, stage order, language, no invented numbers
- [x] Adding a fixture is documented in the test file header
**Verify:** `npm run test -- tests/ai`
**Dependencies:** 27
**Files:** `tests/ai/fixtures/*.json`, `tests/ai/eval.test.ts`, `scripts/eval-ai.ts`
**Size:** M

### Checkpoint C
- [ ] Paste script → generated themed deck in editor, credits deducted, failures refunded
- [ ] Eval fixtures green in CI
- [ ] Human review before Phase 3

---

## Phase 3 — SaaS Surface

### Task 32: Stripe checkout + webhook + subscriptions
**Description:** Products/prices for the agreed plans, checkout route, webhook with signature verification and idempotency, `subscriptions` upsert, plan limits wired into the credits service.
**Acceptance:**
- [x] Checkout upgrades the org's plan; webhook is idempotent on replay
- [x] Plan limits enforced server-side (generation blocked past limit with clear error)
- [x] Test-mode purchase works end-to-end
**Verify:** `npm run test -- stripe` + manual test-mode purchase
**Dependencies:** 28 (blocked by spec Open Question 1)
**Files:** `src/app/api/stripe/checkout/route.ts`, `src/app/api/stripe/webhook/route.ts`, `src/server/services/billing.ts`, `drizzle/0004_billing.sql`, `tests/integration/billing.test.ts`
**Size:** M

### Task 33: Billing settings + plan gating UI
**Description:** `/app/settings/billing`: current plan, usage meter (credits used/limit), invoices link, upgrade/downgrade. Gating UX (upsell dialogs) when limits are hit.
**Acceptance:**
- [x] Usage meter reflects `usage_counters` accurately
- [x] Upgrade flow returns to the app with the new plan active
- [x] Limit-hit states show actionable upgrade copy in French
**Verify:** Playwright `e2e/billing.spec.ts` (test mode)
**Dependencies:** 32
**Files:** `src/app/(app)/app/settings/billing/page.tsx`, `src/components/app/billing/*` (3 files)
**Size:** M

### Task 34: Marketing landing + pricing
**Description:** `/` landing (hero, value prop, template gallery preview, how-it-works, CTA) and `/pricing` (plans, credit explanation, FAQ), with SEO metadata and OG images.
**Acceptance:**
- [x] Lighthouse performance ≥ 90 on mobile for `/` and `/pricing`
- [x] OG image renders correctly when shared (test with a preview tool)
- [x] CTAs route to signup/checkout correctly
**Verify:** Lighthouse run + manual share preview
**Dependencies:** 8, 32
**Files:** `src/app/(marketing)/**` (5–6 files), `src/app/opengraph-image.tsx`
**Size:** M

### Task 35: Analytics, monitoring, rate limiting
**Description:** PostHog events for the spec's success criteria (signup, generation started/succeeded/failed, deck presented, audience joined), Sentry for errors, and rate limiting on AI + public routes.
**Acceptance:**
- [x] Events visible in PostHog with `orgId` (hashed) and plan properties
- [x] Sentry captures server and client errors with request context
- [x] Rate limits return 429 with retry-after and are covered by tests
**Verify:** Manual event check + `npm run test -- rate-limit`
**Dependencies:** 29
**Files:** `src/lib/analytics.ts`, `src/lib/monitoring.ts`, `src/lib/rate-limit.ts`, `tests/unit/rate-limit.test.ts`
**Size:** M

### Task 36: E2E happy path + accessibility pass
**Description:** Full Playwright flow: signup → generate (mocked) → edit → present → audience sync in a second context; plus light mode, focus states, and reduced-motion support.
**Acceptance:**
- [x] E2E spec passes in CI deterministically (no flake > 1 in 20 runs)
- [x] Light mode passes contrast checks; reduced-motion disables slide animations
- [x] Keyboard-only run through the app is possible
**Verify:** `npm run test:e2e` repeated locally
**Dependencies:** 30, 22, 34
**Files:** `e2e/happy-path.spec.ts`, `src/styles/globals.css` (light tokens), a11y fixes
**Size:** M

### Checkpoint D
- [x] New user can pay, generate, edit, present, and be limited correctly by plan
- [x] E2E green and stable in CI
- [x] Human review before Phase 4

---

## Phase 4 — Hardening & V2 Rehearsal

### Task 37: V2 rehearsal on plain Postgres
**Description:** `docker compose up` brings up vanilla Postgres + the Next.js standalone build; run the full migration chain and the integration test suite against it; document every gap in `docs/architecture.md`.
**Acceptance:**
- [x] All migrations apply cleanly to vanilla Postgres 16
- [x] Integration tests pass against the container (auth mocked)
- [x] Every Supabase-specific dependency is listed with its V2 replacement
**Verify:** `docker compose up` from a clean volume + `npm run test -- integration`
**Dependencies:** 36
**Files:** `docker-compose.yml`, `Dockerfile`, `docs/architecture.md` (migration table update)
**Size:** M

### Task 38: Observability + performance pass
**Description:** Structured logging in services, slow-query review with indexes verified, deck payload caching where safe, and a load test of the audience route.
**Acceptance:**
- [x] Audience route sustains 100 concurrent viewers on one deck with p95 < 500 ms
- [x] No unindexed hot-path queries remain (documented check)
- [x] Logs include `requestId`, `orgId`, `deckId`
**Verify:** Load test script + manual log inspection
**Dependencies:** 35
**Files:** `src/lib/logger.ts`, `scripts/loadtest-audience.ts`, index migration if needed
**Size:** M

### Task 39: Docs sync + launch checklist
**Description:** Update `docs/spec.md` (decisions resolved, open questions closed), `docs/architecture.md` (ADRs), `tasks/plan.md` (final state), README, and write the launch checklist (env vars, DNS, Stripe live keys, backups, support runbook).
**Acceptance:**
- [x] Every open question in the spec is resolved or explicitly deferred
- [x] Launch checklist is executable by someone who has never touched the repo
- [x] README explains local setup in ≤ 10 steps
**Verify:** Human review; fresh-clone walkthrough
**Dependencies:** 37, 38
**Files:** `docs/spec.md`, `docs/architecture.md`, `README.md`, `docs/launch-checklist.md`
**Size:** S

### Checkpoint E (Launch)
- [x] `docker compose up` runs the stack on vanilla Postgres
- [x] Launch checklist complete
- [ ] Human sign-off

---

## Phase 5 — Premium Redesign

> Scope: product chrome only. `src/components/slides/**` and deck themes are untouched. Every task keeps existing `data-testid`s and accessible names so e2e specs keep passing. Files over ~300 lines that a task touches get split as part of that task.

### Task 39a: Auth fixes found during the Phase 5 audit (approved 2026-10-04)
**Description:** (1) `getSession()` cached the session in module state, shared across all requests on a server instance — one user could receive another's session/org. Now memoized per request with `React.cache`. (2) `middleware.ts` sat at the repo root, which Next.js ignores when `src/` exists, so session refresh, middleware redirects, and the `/p/*` rate limit never ran. Moved to `src/middleware.ts`; path rules extracted to `src/lib/auth/route-access.ts` and fixed before activation (`/callback` and `/opengraph-image` public; `/api/*` never redirected so Stripe webhooks and JSON 401s keep working).
**Acceptance:**
- [x] No module-level session state; memoization is per request
- [x] Build reports `ƒ Middleware`; protected pages 307 → `/login?callbackUrl=…`
- [x] `/callback`, `/pricing`, `/opengraph-image` public; `POST /api/stripe/webhook` reaches signature check (400, not redirect); `/api/ai/generate` returns 401
- [x] `/p/*` responses carry `X-RateLimit-*` headers
- [x] Unit tests for route access rules
- [ ] Sign-in → session refresh verified end-to-end with the database up (blocked: Docker not running)
**Files:** `src/lib/auth/session.ts`, `src/middleware.ts` (moved), `src/lib/auth/route-access.ts`, `tests/unit/route-access.test.ts`, `docs/architecture.md`
**Size:** S

### Task 40: Token system, fonts, and design guardrail
**Description:** Rewrite product tokens for the refined-dark direction and document them in `docs/design-system.md`. Proposed starting values (final values must pass the contrast test): bg `#0A0A0B`, surface `#111113`, surface-2 `#18181B`, surface-3 `#1F1F23` (hover/selected), border `rgb(255 255 255 / 0.07)`, border-strong `/ 0.12`, text `#EDEDEF`, muted `#A1A1AA`, faint raised from `#52525b` (≈2.6:1, fails) to a value ≥ 4.5:1; primary `#6E56CF`, primary-hover `#7D66D9`, accent-text `#BAA7FF`, ring = primary at 50 %. Tighter radii (6/8/12/16), near-invisible shadows, and app type scale (page title 24–28 px / 600 / −0.02em tracking). Load Geist + Geist Mono via `next/font/google`. Map shadcn CSS variables to these tokens. Add a guardrail test.
**Acceptance:**
- [x] `docs/design-system.md` updated: tokens, type scale, "violet = actions/focus/selection only" rule, no glows/gradient text
- [x] Geist actually renders (verified in browser); `--font-*` tokens point at the `next/font` variables
- [x] Unit test asserts token contrast: text/muted/faint ≥ 4.5:1 on bg and surface; white on primary ≥ 4.5:1
- [x] Guardrail test fails on raw palette classes (`zinc-`, `violet-`, `white/[`, …), hex, or `rgba(` in `src/app` + `src/components` outside `slides/`; ships with an allowlist of not-yet-migrated files that later tasks shrink to empty
**Verify:** `npm run test`; screenshot of `/app` showing Geist
**Dependencies:** none
**Files:** `src/styles/globals.css`, `src/app/layout.tsx`, `docs/design-system.md`, `tests/unit/design-tokens.test.ts`, `tests/unit/design-guardrail.test.ts`
**Size:** M

### Task 41: Install approved deps + core primitives
**Description:** Install `framer-motion`, `sonner`, `cmdk`, and Radix packages through `npx shadcn add`: input, textarea, label, card, badge, dialog, sheet, tabs, select, tooltip, skeleton, switch, scroll-area, popover, sonner, command. Primitives are themed through the variable mapping from Task 40, not by editing their source. Bring the existing `button` and `dropdown-menu` onto tokens the same way (regenerate if needed). Button variants: primary, secondary (surface-2 + border), ghost, outline, destructive; sizes sm/md/lg/icon.
**Acceptance:**
- [x] All listed primitives exist in `src/components/ui` with no raw palette classes
- [x] A scratch route renders every primitive in every state (default/hover/focus/disabled/invalid) for review
- [ ] Focus rings visible on every interactive primitive
**Verify:** Scratch route at 1440×900 + keyboard tab-through; `npm run build`
**Dependencies:** 40
**Files:** `package.json`, `src/components/ui/*` (generated), `src/app/dev/ui/*` + `src/app/dev/shell/page.tsx` (dev-only, 404 in production). Primitives are hand-authored in shadcn's `forwardRef` structure: the current shadcn CLI emits React 19-only components
**Size:** M

### Task 42: Shared app patterns + motion presets
**Description:** Compose the primitives into reusable patterns every screen uses: `PageHeader` (title, description, actions), `EmptyState`, `SectionCard` (settings-style form section), `Kbd`, `Logo` (wordmark + mark), `StatusPill` (saved/saving/error), and `motion.ts` presets (fade/rise 250 ms `--ease-out`, list stagger 40 ms) that collapse to opacity-only under `prefers-reduced-motion`. Mount `<Toaster />` once in the app layout.
**Acceptance:**
- [x] Each pattern has typed props, `className` passthrough, and cva variants where relevant
- [x] Motion presets are verified to respect reduced motion (unit test on the hook)
- [ ] Toasts render with tokens and are announced to screen readers
**Verify:** Scratch route; `npm run test`
**Dependencies:** 41
**Files:** `src/components/app/patterns/*.tsx`, `src/lib/motion.ts`, `src/components/app/Shell.tsx` (Toaster mount)
**Size:** M

### Task 43: App shell rebuild + ⌘K command palette
**Description:** Rebuild Shell/Sidebar/Topbar. Sidebar: logo + org name at top, nav (Decks, Nouveau deck, Modèles), settings and a compact credits meter at the bottom, collapse state persisted and reflowing content, off-canvas `Sheet` below `lg`. Topbar: slim (48–56 px), breadcrumbs, ⌘K trigger, user menu. Remove the dead bell and the light/dark toggle (light mode is deferred). Command palette (`cmdk`): navigate, search decks by title, "Nouveau deck", "Ouvrir les paramètres". Fix the double `lg:pl-64` padding bug.
**Acceptance:**
- [x] No horizontal overflow at 390×844; sidebar becomes a drawer with focus trap
- [ ] Collapsing the sidebar reflows content and persists across reloads
- [ ] ⌘K / Ctrl+K opens the palette from any `/app` page; Esc closes; fully keyboard-operable
- [x] Credits meter reads the same source as billing `UsageMeter` (no new queries in the client)
- [x] All shell copy lives in `src/components/app/messages.ts`
**Verify:** Browser at 1440×900 and 390×844; existing e2e green
**Dependencies:** 42
**Files:** `src/components/app/Shell.tsx`, `Sidebar.tsx`, `Topbar.tsx`, `CommandMenu.tsx`, `CreditsMeter.tsx`, `breadcrumbs.ts`, `messages.ts`; `src/server/services/workspace.ts` + `src/lib/db/repositories/organizations.ts` (shared usage source); shell layout moved from `(app)/layout.tsx` to `(app)/app/layout.tsx` so `/present` no longer renders inside the shell
**Size:** M

### Checkpoint F — Foundation review
- [ ] Screenshots of primitives scratch route and shell (desktop + mobile) approved by human
- [x] `lint`, `typecheck`, `test`, `build` green

### Task 44: Dashboard + template gallery
**Description:** Dashboard: `PageHeader` ("Tableau de bord" — the e2e heading) with primary "Générer un deck" and secondary "Deck vierge" (blank-deck dialog), toolbar (search, sort as Radix `Select`), thumbnail-first deck cards (16:9 render, title, relative date, status badge, actions menu), skeletons matching the card shape, `EmptyState`. Templates: category filter (derived from data: Conversion / Diagnostic / Formation / Vente Directe), cards with real slide thumbnails, preview `Dialog` with slide strip and arrow-key navigation, "Utiliser ce modèle". Native `confirm()` on delete replaced by a confirmation dialog; rename/duplicate/delete give toast feedback. Grid/list toggle dropped (not needed for a thumbnail-first grid; would be new scope).
**Acceptance:**
- [x] Keeps `deck-card`, `create-deck-open`, "Rechercher un deck", "Trier les decks", "Plus d'options", menu item names, `dashboard-empty-state`, `dashboard-no-results`
- [x] e2e dashboard spec updated in this task: sort drives the Radix Select; delete clicks the confirmation dialog
- [x] Card hover/focus states match; the thumbnail is a keyboard-reachable link to the editor (overlay link, since slides can render their own buttons/links)
- [x] Guardrail allowlist shrinks by every file touched
- [x] `npm run test:e2e -- dashboard` green (2026-10-12, against the Docker stack)
**Verify:** `/dev/dashboard` preview (seed content, no DB) at 1440×900 and 390×844 — no overflow, no console errors, rename input receives focus, body pointer lock released after dialogs; `npm run test:e2e -- dashboard` once the DB is up
**Dependencies:** 43
**Files:** `src/app/(app)/app/page.tsx`, `DashboardFilters.tsx`, `templates/page.tsx`, `src/components/app/dashboard/*` (DeckCard, DeckActionsMenu, DeleteDeckDialog, CreateDeckDialog, format, messages), `src/components/app/templates/*`, `src/lib/db/repositories/templates.ts` (`listTemplateGallery`), `e2e/dashboard.spec.ts`, `src/app/dev/dashboard/page.tsx`
**Size:** M

### Task 45: Generation wizard
**Description:** Three clear steps (Script → Modèle & thème → Paramètres) with a stepper, a large script textarea with live character count against the 30k limit, template and theme as selectable cards with thumbnails, then a generation progress view as a vertical stage timeline (Brief → Plan → Slides n/N → Terminé) with cancel.
**Acceptance:**
- [ ] Keeps placeholder `Collez votre script de vente…`, "Générer le deck", "Nouveau deck IA"
- [ ] Stage events from the existing API drive the timeline; no API changes
- [ ] Credit cost shown before generating; limit-hit state uses `UpgradeDialog`
**Verify:** `npm run test:e2e -- generation`; manual run with a fixture script
**Dependencies:** 44
**Files:** `src/components/app/wizard/GenerationWizard.tsx` (split into `steps/*.tsx`), `src/app/(app)/app/new/page.tsx`
**Size:** M

### Task 46: Deck editor
**Description:** Three-pane layout: slide rail (numbered thumbnails, reorder, add/duplicate/delete via menu), centered canvas on a neutral stage, right inspector (fields grouped in sections, inline validation). Top bar: back, editable deck title, `StatusPill` save state, theme switch popover, "Présenter" primary. Split `SlideFields.tsx` (455 lines) and `EditorShell.tsx` (424 lines) into field/section components.
**Acceptance:**
- [ ] Keeps `slide-item`, `slide-field-title`, `editor-status`, `editor-empty`, `add-slide-*`, `slide-error-title`, "Monter le slide N", "Présenter"
- [ ] Inspector collapses to a bottom `Sheet` below `lg`
- [ ] No file in `editor/` exceeds ~300 lines
**Verify:** `npm run test:e2e -- editor`; manual edit/reorder/autosave
**Dependencies:** 44
**Files:** `src/components/app/editor/*` (EditorShell, SlideList, SlideFields split, SlideCanvas)
**Size:** M (split into 46a layout / 46b inspector if it exceeds one session)

### Task 47: Presenter + audience views
**Description:** Presenter (animation-free per design system): current slide large, next slide preview, monospaced timer + per-slide time, tabs for Script / Notes / Métriques, connection status of audience link, copy-link with toast, keyboard hint bar (`Kbd`). Audience: full-bleed, zero chrome, framer-motion slide transitions (450 ms, opacity-only under reduced motion), elegant "En attente du présentateur" state. Split `PresenterShell.tsx` (442 lines).
**Acceptance:**
- [ ] Presenter has no animations; audience has no visible controls or focus rings
- [ ] Keyboard map unchanged (arrows, space, `F`, `P`)
- [ ] Works at 1440×900 and 1920×1080; audience works on mobile
**Verify:** Two browsers side by side; `npm run test:e2e`
**Dependencies:** 43
**Files:** `src/components/presenter/PresenterShell.tsx` (split), `AudienceView.tsx`, `src/app/p/[token]/page.tsx`, `src/app/(app)/present/layout.tsx`
**Size:** M

### Checkpoint G — Core product review
- [ ] Dashboard, wizard, editor, presenter, audience approved by human (desktop + mobile screenshots)
- [x] Full e2e suite green (2026-10-12: 6 passed, AI generation spec skipped by design; fixed slide reorder unique violation, presenter landmarks, dashboard search race)

### Task 48: Settings + billing
**Description:** Settings layout with a left sub-nav (Profil, Organisation, Facturation) and `SectionCard` form sections with right-aligned save actions. Organisation: members table with role badges. Billing: current plan card, usage meter, plan comparison cards, invoices table.
**Acceptance:**
- [ ] Every settings page uses the same section pattern
- [ ] Limit/upgrade copy unchanged in meaning; French-first
**Verify:** Browser review at 1440×900 and 390×844
**Dependencies:** 42
**Files:** `src/app/(app)/app/settings/*`, `src/components/app/billing/*`
**Size:** M

### Task 49: Auth + onboarding
**Description:** Split-screen auth: form on the left (password / lien magique as tabs, inline validation), a live rendered deck slide on the right (hidden on mobile). Onboarding as a ≤ 3-step stepper with progress, brand color picker, first template choice.
**Acceptance:**
- [ ] Keeps "Se connecter", "Démarrer", `vous@exemple.com` / `••••••••` placeholders
- [ ] Right-panel slide is rendered by `SlideRenderer`, not a screenshot
**Verify:** `npm run test:e2e -- core smoke`; manual signup flow
**Dependencies:** 42
**Files:** `src/app/(auth)/layout.tsx`, `login/LoginContent.tsx`, `signup/SignupContent.tsx`, `callback/CallbackContent.tsx`, `src/app/onboarding/*`
**Size:** M

### Task 50: Marketing landing + pricing
**Description:** Rebuild the landing in the refined-dark register: no blur blobs, no gradient text, no fake window chrome. Hero with a live `SlideRenderer` preview (auto-advancing through a template), the seven-framework template strip using real themes, presenter/audience feature section with real UI, pricing teaser, FAQ, footer. Replace unverifiable stats ("10x", "100 % généré par IA") with verifiable facts (7 frameworks, 27 slide types, 5 themes). Pricing page uses the same plan cards as billing. Update the OG image to the new look.
**Acceptance:**
- [ ] Lighthouse mobile performance ≥ 90 on `/` and `/pricing` (preview is lazy/below-the-fold-safe)
- [ ] No claim on the page that the product cannot back up
- [ ] CTAs still route to signup/checkout
**Verify:** Lighthouse; browser review; OG preview tool
**Dependencies:** 41
**Files:** `src/app/(marketing)/page.tsx` (split into `sections/*.tsx`), `layout.tsx`, `pricing/page.tsx`, `src/app/opengraph-image.tsx`
**Size:** M

### Task 51: Polish + QA pass
**Description:** Run a final consistency pass on spacing, alignment, and empty/loading/error states for every surface; empty the guardrail allowlist; add Playwright screenshot baselines for key screens.
**Acceptance:**
- [ ] Guardrail allowlist is empty: zero raw palette classes/hex outside `slides/`
- [ ] axe passes on every surface; keyboard-only run-through works
- [ ] Reduced-motion verified; no layout shift on dashboard and editor load
- [ ] Screenshot baselines committed for dashboard, editor, presenter, audience, login, landing
**Verify:** Definition of done + `npm run test:e2e`
**Dependencies:** 44–50
**Files:** `e2e/visual.spec.ts`, guardrail allowlist, touch-ups
**Size:** M

### Checkpoint H — Redesign sign-off
- [ ] All surfaces approved by human
- [ ] `lint`, `typecheck`, `test`, `build`, `test:e2e` green
- [ ] `docs/design-system.md` reflects the shipped system

---

## Phase 6 — Legacy integration (`get-funnel-go` → v2)

> Source analysis 2026-10-08. Legacy repo is read-only (spec decision 12). Decisions 9–11 in `docs/spec.md`.
>
> **Approved 2026-10-09:** Tasks 62, 57b, 59 and 60 (their "Ask first" schema/security changes), to be built one at a time in that order.

### Task 52: Quick fixes found during the legacy analysis
**Description:** `npm run db:seed` loaded stage-only template rows from `fake-data.json` instead of the ported decks, so "Use template" created empty decks. Slides printed icon names as text ("award") instead of icons.
**Acceptance:**
- [x] `db:seed` calls `seedTemplates()` (real slides, notes, scripts); stage-only templates removed from `fake-data.json`
- [x] Local dev DB reseeded: Commercial 20, RDV 22, VSL 25, Webinaire 20 slides
- [x] Curated icon vocabulary (`src/lib/slides/icons.ts`) rendered by `SlideIcon` in authority/benefits/definition/problem/why; unknown words fall back, emoji kept
- [x] Slide-generation prompt restricts `icon` to the vocabulary
**Verify:** `tests/unit/slide-icon.test.tsx` (incl. every template icon name is known)
**Size:** S

### Task 53: Port Lancement Orchestré template
**Description:** 26 legacy slides (`components/lancement/`, scripts in `SlideScriptsLancement.jsx`) to `scripts/seed/templates/lancement.json`, mapped onto existing types; interactive tabs/expanders become static content. Agency-specific facts become placeholders with `needsInput`.
**Acceptance:**
- [x] Validates with `validate-template.ts`; order and arguments match the legacy deck (26 slides, `lancement-orchestre.json`)
- [x] Every slide carries the legacy script; no client names, revenue or bio in the template
**Verify:** template gallery preview vs legacy deck side by side
**Dependencies:** 52 · **Size:** M

### Task 54: Port Evergreen template
**Description:** 23 legacy slides (`components/ev/` + 3 reused web slides, scripts in `SlideScriptsEV.jsx`), same rules as Task 53.
**Acceptance:** same as Task 53 — [x] done 2026-10-08 (23 slides, `evergreen.json`)
**Dependencies:** 52 · **Size:** M

### Task 55: Port Tunnel Pay template
**Description:** 26 legacy slides (`components/pay/`, scripts in `SlideScripts.jsx` `pay`), same rules as Task 53.
**Acceptance:** same as Task 53 — [x] done 2026-10-08 (26 slides, `tunnel-pay.json`)
**Dependencies:** 52 · **Size:** M

### Task 56: Port the legacy Webinaire and Commercial decks
**Description:** Found 2026-10-08: v2's `webinaire` and `commercial` templates are not ports of the legacy decks (v2 Webinaire is a live webinar sales pitch; v2 Commercial is a sales-system consulting pitch). Port the legacy decks as new templates — `tunnel-webinaire` (24 slides, legacy `DeckWeb.jsx`) and `pitch-commercial` (legacy `DeckCommercial.jsx`, 44 slides condensed to the 40-slide deck limit by merging slides the legacy split only for layout: client names 3→1, team 2→1, FAQ 2→1). Keep the existing two as extra templates, renamed "Webinaire Live" and "Système Commercial". Commercial has no legacy scripts: write presenter scripts from the slide copy and mark them for human review. Live-personalisation blanks (`___ €`) stay as placeholders until Task 60's blanks type lands.
**Acceptance:**
- [x] Slide order and arguments match the legacy decks (`tunnel-webinaire.json` 24 slides; `pitch-commercial.json` 40 slides holding all 44 legacy slides — names 3→1, team 2→1, FAQ 2→1)
- [x] Same placeholder policy as Tasks 53–55 (enforced by the template test)
- [x] Commercial scripts flagged for review (every slide's notes end with "Script rédigé lors du portage — à relire.")
- [ ] Human review of the 40 written Commercial scripts (tutoiement vs vouvoiement, added copy flagged in notes)
**Dependencies:** 52 · **Size:** M

### Task 56b: Scrub agency content from the 4 already-ported templates
**Description:** RDV Classique, VSL, Webinaire and Commercial were ported before spec decision 10 and still contain the founder's name, the GetFunnels brand, client names and real revenue figures (found 2026-10-08). Apply the same placeholder policy as Tasks 53–55; the full-fidelity versions move to the GetFunnels org in Task 57 (sourced from the legacy repo).
**Acceptance:**
- [x] No founder name, agency brand, client names or case-study figures in `scripts/seed/templates/*.json` (enforced by a unit test)
- [x] Slides with placeholders carry `needsInput: true`
**Dependencies:** 52 · **Size:** S

### Task 57: Private "GetFunnels" organization with the full-fidelity decks
**Description:** Seed a GetFunnels org holding the 7 decks with the real agency content (founder bio, client names, figures, screenshots, Funnelytics/client funnel links). Move the legacy logo and screenshots from the Base44-hosted Supabase bucket into our `StorageProvider`.
**Acceptance:**
- [x] Org and decks visible only to its members via org-scoped queries (active org comes only from the user's own membership; seeded member belongs to no other org)
- [x] …and via RLS — done 2026-10-12: `0006_rls_policies` in the journal (portable to plain Postgres), applied to the dev DB; `tests/integration/rls.test.ts` green on a disposable DB (20 tests). Still open: the server role bypasses RLS (`docs/data-model.md` → Known gap)
- [x] 7 overlays validated by `tests/unit/getfunnels-org-seed.test.ts` (schema, slide order, no leftover placeholders outside `keepPlaceholders`, no URLs); local DB seeded: 7 decks / 186 slides, re-seed leaves them untouched
- [ ] Human review of the agency content. Known legacy inconsistencies kept as-is: funnel count "+470" (RDV/VSL/Lancement/Pay) vs "1700+" (Webinaire) vs "+2 000 tunnels" (Commercial), and "150+ funnels" in VSL flow step 05. Pitch Commercial: slide 20 packs have no prices (legacy had none), slide 18 has only 2 captions (legacy mosaic was empty), slide 30 is a fixed worked example (not a live blank)
- [x] No asset URL points to the legacy Base44 storage → done in Task 57b (source list in `scripts/seed/getfunnels-org/LEGACY-ASSETS.md`)
**Member (decided 2026-10-08):** `tools@digitalspeak.group` — Supabase Auth user `427c7e0a-d396-4566-8fa6-093fb69b606d` created by admin API, email confirmed; password set by the owner and never stored in the repo. Owner role.
**Split (2026-10-09):** `src/lib/storage` is empty and the gallery renderer ignores `assetId`, so the screenshots/logo move to Task 57b. Task 57 now covers the text content: each org deck is its system template plus an overlay (`scripts/seed/getfunnels-org/<slug>.json`) that replaces the `needsInput` slides with the real agency content; per-prospect live blanks stay placeholders (`keepPlaceholders`). Seeded by `seedGetFunnelsOrg()` (in `db:seed`, or `npx tsx scripts/seed/getfunnels-org.ts`); decks are insert-only so the team's edits survive re-seeding; present tokens are generated, never committed.
**Dependencies:** 53–56 · **Size:** M

### Task 57b: StorageProvider + slide images + legacy asset migration
**Description:** Implement `StorageProvider` (interface + Supabase implementation, swappable for the VPS), render `gallery` images from `assetId`, serve images to the audience view without exposing private buckets (signed URLs or a token-scoped route), and copy the legacy logo + screenshots from the Base44 bucket into our storage, linking them to the GetFunnels org decks.
**Acceptance:**
- [x] `StorageProvider` interface with no vendor types; Supabase implementation server-only
- [x] Gallery renders the image when `assetId` resolves, the current placeholder otherwise
- [x] Audience view (`/p/[token]`) shows images without leaking other orgs' assets
- [x] No asset URL points to the legacy Base44 storage
**Ask first:** touches the audience-link security model and may add a storage bucket — approved 2026-10-09
**Done 2026-10-09:** `src/lib/storage` (interface, Supabase impl on private bucket `slide-assets`, in-memory impl for tests); `src/server/services/assets.ts` (upload with byte-sniffed type, PNG/JPEG/WebP/GIF ≤ 4 MB, no SVG; org/token reads). Routes: `POST /api/assets` (upload, 30/min/user), `GET /api/assets/[id]` (session + org), `GET /p/[token]/assets/[id]` (only assets the deck references; also used by PDF export). Gallery renders images via `useAssetUrl()`, placeholder when missing or failing; editor "Image" field uploads/replaces/removes. 12 legacy images copied into storage as GetFunnels org assets with fixed ids (`scripts/seed/getfunnels-org-assets.json`, `scripts/migrate-legacy-assets.ts`); verified on the dev stack (own 200, other org 404, unreferenced 404, bad token 404, anonymous app route 401, SVG 415). They are not on any slide yet: the legacy screenshots sit on `proof` slides, which get images with Task 60's screenshot-proof type; the logo waits for an image field on cover/authority (Task 59/60). Not done: no cleanup of replaced/removed images (orphans stay in storage). Verify: `tests/unit/assets.test.tsx`.
**Dependencies:** 57 · **Size:** M

### Task 58: "GetFunnels Signature" design kit
**Description:** Rebuild the legacy visual language as theme-driven slide styling: breathing glow blobs, faint grid and perspective floor, glass cards, gradient-clip headlines, pill section label, direction-aware transition (`[0.22,1,0.36,1]`, 0.5 s) with staggered reveals, glowing progress. Per-template accent themes from the legacy decks (RDV `#470C85`, Lancement `#7c3aed`, VSL `#0e7490`, Web `#065f46`, Evergreen `#92400e`, Pay `#be185d`).
**Acceptance:**
- [x] Extends `ThemeTokensSchema` (optional `style`: decor, surface, headline); existing themes still validate
- [x] Reduced motion: no infinite animations (global reduced-motion rule); presenter view stays animation-free
- [x] 6 Signature themes seeded (`4…06`–`4…0b`) and assigned to the 7 legacy templates
- [ ] Screenshot comparison with legacy cover/problem/flow/kpi approved by human (`/dev/slides`)
**Ask first:** theme schema extension
**Dependencies:** 52 · **Size:** L

### Task 59: Layout variants per slide type
**Description:** Optional `layout` on slides; 3–5 layouts for the most-used types (cover, statement, problem, benefits, flow, kpi, proof, cta). Editor switches layouts from thumbnails; AI varies layouts across a deck (no two consecutive identical).
**Acceptance:**
- [x] Old slides without `layout` render unchanged
- [x] Layout switch keeps content
- [ ] Human review of the 16 variants (`/dev/slides?template=rdv-classique&layouts=all`)
**Ask first:** schema change (slide `layout`) — approved 2026-10-09
**Done 2026-10-09:** `SLIDE_LAYOUTS` (`src/lib/slides/layouts.ts`): 3 layouts for each of cover, statement, problem, benefits, flow, kpi, proof, cta — the first is the original renderer, untouched; the 16 variants live in `src/components/slides/layouts/`. Optional per-type `layout` on `SlideSchema`, stored in `slides.layout` (migration `0005_slide_layout`), carried through templates, duplicate/publish/restore, presenter, audience, dashboard thumbnails; unknown stored values fall back to the original. Editor: "Mise en page" picker with live thumbnails, autosaved. AI: `assignLayouts()` after generation (per-type rotation, never the same layout twice in a row; no tokens). Templates and org decks keep their original look (no layout set) until reviewed. Verify: `tests/unit/slide-layouts.test.tsx`.
**Dependencies:** 58 · **Size:** L

### Task 60: New slide types from legacy mechanics
**Description:** `embed` (sandboxed iframe, domain allow-list — Funnelytics, ClickFunnels, systeme.io…), live gallery (carousel of embeds/screenshots), screenshot proof with lightbox (assets), gauge KPI, page mockup (opt-in/checkout/inscription structure), live blanks (presenter fills `___` values during the call; audience sees them update).
**Acceptance:**
- [x] Each type: schema + renderer + editor fields + AI prompt support + tests
- [x] Embed URLs validated server-side against the allow-list; ~~iframe `sandbox` without `allow-same-origin`+`allow-scripts` together~~ → **revised 2026-10-09 (user decision):** the funnel pages render blank without `allow-same-origin`, so embeds get `allow-scripts allow-same-origin`; safe because an embed can never share our origin (allow-list = third-party domains only, and the app's own host and its parent/sub-domains are refused, tested)
- [x] Ported templates/org decks switched to the new types where the legacy used them
- [ ] Human review of the converted slides (org decks: `/p/<token>` of each deck; templates: `/dev/slides`)
**Ask first:** schema change (new types) — approved 2026-10-09
**Done 2026-10-09:** six types — `embed`, `showcase` (live gallery), `screenshots` (lightbox), `gauge`, `mockup`, `blanks` (live). Allow-list: Funnelytics, ClickFunnels, systeme.io, getfunnels.agency, go-scale.systems, video-ads-agency.com. Thumbnails and the next-slide preview never load iframes; live embeds have an "open in new tab" link (ClickFunnels pages refuse framing with `X-Frame-Options: SAMEORIGIN`, as they did in the legacy). Live blanks: presenter types in the Script tab, values broadcast with each sync event (debounced 300 ms), validated on the audience side, never saved — verified presenter → audience over Supabase Realtime. Editor: number inputs (gauges) and French option labels. Converted: 6 Funnelytics slides → `embed`, 6 client galleries → `showcase`, 5 proof carousels → `screenshots` (org decks linked to the 10 migrated images), 3 "7 métriques" KPI slides → `gauge`, 5 page structures → `mockup`, Pitch Commercial 35/36/38 → `blanks` (no longer kept placeholders). Kept as they were: RDV 16 (single screenshot with callouts, `proof`), RDV 5 (decorative gauge, `why`), Lancement 13 (six-page map, `architecture`). Verify: `tests/unit/legacy-slide-types.test.tsx`.
**Dependencies:** 58 · **Size:** L

### Task 61: Illustration library
**Description:** Port the 9 legacy animated SVG illustrations and the signature diagrams (radar sweep, packets travelling along a flow, honeycomb, count-up, gauge) as reusable, theme-coloured visuals selectable on slides.
**Acceptance:**
- [x] Coloured by theme tokens (no hard-coded hex); static under reduced motion
- [x] Selectable in the editor; never required for a slide to render
**Done 2026-10-09:** 12 illustrations in `src/components/slides/illustrations/` — the 9 legacy SVGs (funnel, automation, dashboard, datastream, network, orbit, target, shapes, wave; unused in the legacy app itself) redrawn in the theme's primary/accent/muted, plus the Signature diagrams radar (sweep), packets (travelling along a flow) and honeycomb. Stored as an optional `content.illustration` on every slide type (no DB column, no migration; kept out of the AI draft schema). Rendered behind the content, bottom-right; CSS motion only on the live audience slide with theme motion on, still in the presenter/editor/thumbnails/PDF and under reduced motion. Editor: "Illustration" picker with previews in the deck's colours. Not ported: count-up (a number effect, not an illustration) and the gauge (now the `gauge` slide type). No template or org slide uses one yet. Verify: `tests/unit/illustrations.test.tsx`.
**Dependencies:** 58 · **Size:** M

### Task 62: Structured presenter scripts
**Description:** Upgrade the single `script` string to the legacy structure `{punchline, timing, tag, transition, bullets, script}`; port the legacy values for the 6 scripted decks; Script tab renders like the legacy panel; Stats tab tracks against the deck's target duration; slide strip shows real thumbnails.
**Acceptance:**
- [x] Existing plain-string scripts still display (backward compatible)
- [x] Target duration = sum of slide timings, with on-track indicator
- [ ] Human review in the presenter (`/present/<deck>`) at 1440×900 and 1920×1080
**Ask first:** schema change (script structure) — approved 2026-10-09
**Done 2026-10-09:** `script` stays the plain body; the structure lives in a new optional `cue` (`ScriptCueSchema`: punchline, durationSec, tag, transition, bullets, closing) stored in `slides.cue` jsonb (migration `0004_slide_script_cue`). Legacy values ported for the 6 scripted decks (146 slides, templates + org decks; punchlines/transitions the earlier port had folded into `script` were moved out). Script tab = tag + target time, punchline, body, transition, closing, collapsible tips; Stats tab = elapsed vs target with ahead/on-track/behind and per-slide time vs target; slide strip = real thumbnails. Editor: "Repères du présentateur" section. Not done: AI generation leaves `cue` empty (kept out of the draft schema for the free-tier token budget); legacy `tagColor` dropped (tokens instead); template notes still repeat the legacy "TAG · timing. tips" line. Verify: `tests/unit/script-cue.test.tsx`.
**Dependencies:** 53–56 · **Size:** M

### Checkpoint I — Legacy integration review
- [x] All 7 legacy decks available as templates; GetFunnels org holds the full decks
- [ ] Signature kit, layouts and new types approved against the legacy decks (screenshots)
- [x] Definition of done green (2026-10-09: lint, typecheck, 509 unit tests, build; `test:e2e` not run)
