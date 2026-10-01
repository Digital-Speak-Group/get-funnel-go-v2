# Architecture

> Companion to `docs/spec.md`. This document defines module boundaries, data flows, and the seams that make the V2 migration (Supabase → self-hosted Postgres on a VPS) a swap instead of a rewrite.

## Principles

1. **Slides are data.** AI and users produce `Slide` JSON; React renders it through a registry. No AI-generated components, ever.
2. **Ports and adapters.** Auth, Realtime, Storage, AI, and Email sit behind interfaces in `src/lib/*`. Business logic never imports a vendor SDK.
3. **Server-first data access.** All reads/writes go through server components, server actions, or route handlers. The browser never talks to the database.
4. **Org scoping everywhere.** Every repository call receives `{ orgId, userId }` and filters by `org_id`. RLS is defense-in-depth.
5. **Framework-agnostic services.** `src/server/services/*` contains plain TypeScript that could run in a standalone Node process. Next.js is a delivery mechanism, not the architecture.

## System Diagram

```
Browser
  │  (cookies, server actions, route handlers)
  ▼
Next.js (Vercel)
  ├─ (marketing)  static/ISR pages
  ├─ (app)        server components ──► src/server/services ──► src/lib/db (Drizzle) ──► Postgres (Supabase)
  │                                 └► src/lib/ai (AIProvider) ──► Anthropic API
  │                                 └► src/lib/storage (StorageProvider) ──► Supabase Storage
  ├─ api/stripe/webhook ──► services/billing ──► Stripe + Postgres
  ├─ api/ai/*            ──► services/generation ──► AI pipeline
  └─ p/[token]           audience view (public, token-gated, no auth)
  │
  └─ Realtime: Supabase broadcast channels ◄── presenter + audience clients
```

## Module Boundaries

| Module | Owns | May import | Must not import |
|---|---|---|---|
| `src/app/**` | routing, layouts, page composition | components, lib/auth session, server actions | `lib/db` directly in client components |
| `src/components/slides/**` | slide rendering, registry | `lib/slides` types, design tokens | `lib/db`, `lib/ai`, server actions |
| `src/components/presenter/**` | presenter widgets | `lib/realtime` client, `lib/slides` types | `lib/db`, `lib/ai` |
| `src/server/services/**` | business rules (decks, generation, billing, credits) | `lib/db`, `lib/ai`, `lib/auth`, `lib/storage` | Next.js-specific APIs (`next/headers`, `next/cache`) |
| `src/lib/db/**` | Drizzle client + repositories | `lib/env` | UI, services |
| `src/lib/ai/**` | provider interface + implementations | `lib/env` | `lib/db`, UI |
| `src/lib/realtime/**` | provider interface + implementations | browser APIs, Supabase realtime | `lib/db` |

Rule of thumb: dependencies point **inward** (UI → services → lib). Nothing in `src/lib` imports from `src/components` or `src/app`.

## Key Data Flows

### 1. Deck generation (paste script → deck)

```
Wizard UI (client)
  → POST /api/ai/generate            (Zod-validated input)
    → services/generation.generateDeck()
      1. extractBrief()        AIProvider, model=fast     → Brief
      2. planDeck()            AIProvider, model=fast     → SlidePlan[]
      3. generateSlides()      AIProvider, model=quality  → Slide[] (validated per slide, retry ≤ 2)
      4. persistDeck()         lib/db transaction: deck + slides + ai_generation + usage_counter
    → stream progress events to UI (SSE or polling; see tasks)
```

Failure at any stage: refund reserved credits, record `ai_generations.status = 'failed'` with error, return structured error.

### 2. Presenter → audience sync

```
PresenterView (client)
  → RealtimeProvider.publish(`deck:${deckId}`, { slideIndex, ts })
      ↳ Supabase Realtime broadcast channel (V1)
      ↳ WebSocket server (V2)

AudienceView (client, /p/[token])
  → RealtimeProvider.subscribe(`deck:${deckId}`, cb) → setSlide(index)
  → initial slide fetched server-side by token
```

- Channel names are deck-scoped, never org-scoped, to avoid cross-tenant leakage.
- Publish is throttled to 10 msg/s; payloads < 1 KB.
- Audience view is read-only and works without an account.
- Fallback for blocked WebSockets: poll `GET /api/p/[token]/state` every 3 s (feature-flagged).

### 3. Billing

```
Settings UI → POST /api/stripe/checkout → Stripe Checkout
Stripe → POST /api/stripe/webhook (signature verified)
  → services/billing.applySubscriptionEvent()
  → subscriptions + usage_counters updated
```

Plan limits are enforced **server-side** in `services/generation` and `services/decks` — never only in the UI.

## Security Model

| Concern | Control |
|---|---|
| Sessions | Supabase Auth, HTTP-only cookies via `@supabase/ssr`; middleware refreshes sessions |
| Authorization | `memberships.role` (owner/admin/editor/viewer); checked in services, mirrored by RLS |
| Tenant isolation | Every repository query filters `org_id`; RLS policies as second layer |
| Secrets | Only `NEXT_PUBLIC_*` reach the client; service-role key is server-only and never used in repositories (RLS-compatible role instead) |
| Audience links | `present_token` = 32-char nanoid; revocable + rotatable; rate-limited; no PII in payloads |
| AI input | Script treated as data, not instructions (prompt-injection note in `docs/ai-generation.md`); length caps; output schema-validated |
| Uploads | Type/size validated server-side; served via signed URLs |
| Stripe | Webhook signature verification; idempotency keys on event ids |
| Rate limits | Per-user and per-org limits on generation, auth, and public audience routes |

## Migration Seams (V1 → V2)

| Capability | V1 (Supabase) | V2 (VPS) | Seam that makes it cheap |
|---|---|---|---|
| Postgres | Supabase Postgres | Postgres 16 in Docker | `DATABASE_URL` only; Drizzle migrations are plain SQL and already run on any Postgres |
| Auth | Supabase Auth | Own JWT (Auth.js or custom) | `AuthService` interface in `src/lib/auth`; pages consume `getSession()` only |
| Realtime | Supabase Realtime broadcast | WebSocket server (`ws`/uWS) | `RealtimeProvider` interface; both implementations ship side by side |
| Storage | Supabase Storage | S3/MinIO | `StorageProvider` interface; only signed-URL shape is shared |
| Email | Resend | Same or SMTP | `EmailProvider` interface |
| Deploy | Vercel | Docker + Caddy on VPS | `output: "standalone"`; no Vercel-only APIs (no Edge Config, no ISR-only features in app routes) |
| Cron | Vercel Cron | systemd timers / cron | Jobs live in `src/server/jobs/*` as plain functions with a thin trigger |

**Migration Rehearsal Findings (Gaps):**
1. **Build-Time Environment Variables:** The Next.js standalone build requires `NEXT_PUBLIC_*` variables (like Supabase URLs/keys) to be present at build time to bake into static assets. In V2, dummy values or real values must be explicitly injected in the CI pipeline/Dockerfile.
2. **Alpine Linux Compatibility:** Tailwind CSS v4's native `oxide` parser fails to install correctly on `node:18-alpine` with `npm ci`. The V2 Docker image must use a `slim` Debian base (e.g., `node:20-slim`) instead.
3. **Database SSL Flag:** The current `client.ts` uses `.includes("localhost")` to disable DB SSL. In V2, a private network DB on a VPS won't be "localhost" but still shouldn't use SSL. We need an explicit `DATABASE_SSL=false` env variable instead.
4. **Mocked Auth in Integration Tests:** Tests like `generate-api.test.ts` rely on mocked Auth. The Next.js container runs against a plain Postgres DB, which has no built-in Auth service (like Supabase Auth). In V2, the real Auth replacement must either be self-hosted alongside Postgres or thoroughly mocked at the boundary layer.

## ADRs (decisions to keep on record)

| # | Decision | Rationale | Status |
|---|---|---|---|
| 1 | Next.js App Router replaces the Vite SPA | One framework for marketing + app, SEO, server-side data access | Accepted |
| 2 | Supabase for V1 (Postgres/Auth/Storage/Realtime) | Speed to market; every piece is replaceable behind a seam | Accepted |
| 3 | Drizzle ORM, not raw supabase-js queries | Portable SQL, typed schema, works on any Postgres in V2 | Accepted |
| 4 | Slides as validated JSON, not components | Required for AI generation and user editing | Accepted |
| 5 | Server-side AI only, `AIProvider` abstraction | Key safety, cost control, provider swap | Accepted |
| 6 | Token-based public audience links | No accounts for viewers; replaces the hardcoded password gate | Accepted |
| 7 | Stripe subscriptions + credit ledger in V1 | Monetization from launch; AI cost control | Accepted |
| 8 | French-first UI, i18n-ready | Existing market and content are French | Accepted |

## Performance Notes

- Slides render in a fixed 1920×1080 design space, scaled with CSS `transform` — one layout math for every screen.
- Deck payloads are cached per request with `unstable_cache`-style helpers only in `src/app` (never in services).
- Realtime messages carry only `{ slideIndex, ts }`.
- Indexes required for hot paths are listed in `docs/data-model.md`.
- Images: Next.js `<Image>` with Supabase Storage remote patterns; uploads pre-resized to ≤ 2000 px.

## Observability and Performance (Phase 4)
- **Structured Logging:** A lightweight JSON `logger` (`src/lib/logger.ts`) logs `orgId`, `deckId`, and other context across services (`generation`, `decks`, `billing`).
- **Index Check:** The hot-path `getAudiencePayload` queries `decks.presentToken` (has unique index), `themes.id` (PK index), and `slides.deckId` (covered by `slides_deck_position_unique`). All hot paths are fully indexed.
- **Payload Caching:** `getAudiencePayload` is cached via `unstable_cache` (60s revalidation).

## Observability

- Structured logs (JSON) from services with `orgId`, `deckId`, `requestId`.
- `ai_generations` is the source of truth for AI cost; a dashboard query sums cost per org/day.
- Errors: Sentry (server + client) behind a thin wrapper so it can be replaced.
- Product analytics: PostHog, event names defined in `docs/spec.md` success criteria.
