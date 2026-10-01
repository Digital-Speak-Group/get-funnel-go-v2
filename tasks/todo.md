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
**Verify:** `npm run test -- rls`
**Dependencies:** 4
**Files:** `drizzle/0001_rls_baseline.sql`, `tests/integration/rls.test.ts`
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
**Verify:** `npm run test -- ai-eval`
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
