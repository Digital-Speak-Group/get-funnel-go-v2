# AGENTS.md

Operating manual for AI coding agents in this repository. Read this file first, then load only the docs you need (see **Docs map**).

## Product

**GetFunnels** — a multi-tenant SaaS where a user pastes a sales script and AI generates a themed, presenter-ready sales deck. The presenter drives from a presenter view (scripts, notes, timer, metrics) while the audience follows in a synced read-only view on another screen or machine.

The legacy app's seven funnel frameworks — RDV Classique, Lancement Orchestré, VSL, Webinaire, Evergreen, Tunnel Pay, Commercial — ship as built-in **templates**. Templates are the product moat: AI fills proven frameworks instead of inventing structure.

Primary market is French-speaking; UI copy ships French-first, written so i18n can be added later without rewrites.

## Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 15+, App Router, TypeScript strict, `src/` dir |
| Styling | Tailwind CSS v4 + shadcn/ui + Radix + lucide-react + framer-motion |
| Database | PostgreSQL via Supabase, accessed with Drizzle ORM |
| Migrations | Drizzle Kit, plain SQL migrations in `drizzle/` |
| Auth | Supabase Auth with `@supabase/ssr` (cookie sessions) |
| Realtime | Supabase Realtime broadcast channels behind `RealtimeProvider` |
| Storage | Supabase Storage behind `StorageProvider` |
| AI | Anthropic Claude behind `AIProvider` — server-side only |
| Payments | Stripe subscriptions + credit ledger |
| Email | Resend behind `EmailProvider` |
| Tests | Vitest (unit/integration) + Playwright (e2e) |
| CI | GitHub Actions: lint → typecheck → test → build |

## Commands

These scripts must exist in `package.json` (create them in Task 1 if missing):

```
npm run dev              # Next.js dev server
npm run build            # production build
npm run start            # production server
npm run lint             # eslint
npm run typecheck        # tsc --noEmit
npm run test             # vitest run
npm run test:watch       # vitest
npm run test:e2e         # playwright test
npm run db:generate      # drizzle-kit generate
npm run db:migrate       # drizzle-kit migrate
npm run db:seed          # seed themes, templates, demo org
npm run db:studio        # drizzle-kit studio
```

Definition of done for any task: `npm run lint && npm run typecheck && npm run test && npm run build` all pass.

## Project structure

```
src/
  app/
    (marketing)/           # public landing, pricing, legal — static/ISR
    (auth)/                # login, signup, callback, onboarding
    (app)/app/             # authenticated product: dashboard, editor, settings
    p/[token]/             # public audience view (no chrome, no auth)
    api/                   # route handlers: ai, stripe, export, health
  components/
    ui/                    # shadcn/ui primitives — do not fork
    app/                   # product chrome: nav, shell, dialogs
    slides/                # slide renderer + registry (type -> component)
    presenter/             # presenter view widgets (timer, script panel, metrics)
  lib/
    env.ts                 # zod-validated environment
    db/                    # drizzle client + repositories (server-only)
    auth/                  # AuthService interface + Supabase implementation
    realtime/              # RealtimeProvider interface + Supabase implementation
    storage/               # StorageProvider interface + Supabase implementation
    ai/                    # AIProvider interface + Anthropic implementation
    slides/                # slide schema, theme schema, validation
  server/
    services/              # framework-agnostic business logic
    ai/                    # pipeline stages + prompts
  styles/                  # globals.css, theme tokens
drizzle/                   # SQL migrations + meta
scripts/                   # seed scripts, content porting
tests/                     # vitest unit/integration
e2e/                       # playwright specs
docs/                      # spec, architecture, data model, AI, design system
tasks/                     # plan.md, todo.md
```

## Conventions

- **TypeScript strict.** No `any`; validate unknown input with Zod at every boundary (route handlers, server actions, env, AI output).
- **Data access is server-only.** Components never import `@supabase/supabase-js` for CRUD and never import `src/lib/db/*`. Data flows through server components, server actions, or route handlers.
- **Every query is org-scoped.** Repository functions take `ctx: { orgId, userId }` and filter by `org_id`. RLS is defense-in-depth, not the primary check.
- **Interfaces before implementations.** Auth, Realtime, Storage, AI, Email each live behind an interface so the Supabase/Vercel V1 can be swapped for a VPS deployment later (see `docs/architecture.md`).
- **Slides are data, never components.** AI and users produce `Slide` JSON validated by `src/lib/slides/schema.ts`; rendering goes through the registry in `src/components/slides/registry.ts`.
- **No inline hex colors or magic spacing.** Use design tokens from `docs/design-system.md`.
- **UI copy is French-first**, user-facing strings live in one place per feature (`messages.ts`) for future i18n.
- **Small files, feature-oriented folders.** A file over ~300 lines is a smell.
- **Tests next to behavior:** schema and service logic get Vitest coverage; user flows get Playwright.

## Boundaries

**Always**

- Run lint, typecheck, tests, and build before declaring a task done.
- Validate all external input (HTTP, AI output, webhooks) with Zod.
- Scope every read/write by `org_id` from the session.
- Keep secrets server-side; only `NEXT_PUBLIC_*` values reach the client.
- Update the relevant doc in `docs/` when a decision changes.
- Follow `docs/design-system.md` for any UI.

**Ask first**

- Schema changes and migrations.
- Adding dependencies.
- Changing auth, billing, or credit logic.
- Changing public URL/route structure or the audience-link security model.
- Anything touching Stripe webhooks or pricing.

**Never**

- Import the service-role key or any secret into client code.
- Query without org scoping.
- Bypass RLS by shipping the service key to the browser.
- Use Vercel-only or Supabase-only APIs in business logic (route handlers, server services) — the V2 target is a VPS.
- Commit `.env*`, secrets, or real customer data.
- Delete or skip failing tests to make a task pass.
- Implement a feature that is not in `tasks/todo.md` without updating the plan first.

## Workflow

Follow this lifecycle for every unit of work:

1. **DEFINE** — requirements unclear? Write/update `docs/spec.md` first. Surface assumptions explicitly.
2. **PLAN** — update `tasks/plan.md` and the current phase of `tasks/todo.md` before coding.
3. **BUILD** — one task at a time, vertical slices (schema + service + UI together), test as you go.
4. **VERIFY** — run the definition of done; for UI, verify in a browser.
5. **REVIEW** — self-review the diff against acceptance criteria and boundaries.
6. **SHIP** — update docs, then commit with a clear message. Never commit unless asked.

At each **checkpoint** in `tasks/todo.md`, stop and ask the human to review before continuing.

## Docs map

| Doc | Load when |
|---|---|
| `docs/spec.md` | Defining scope, success criteria, anything ambiguous |
| `docs/architecture.md` | Module boundaries, migration seams, security, ADRs |
| `docs/data-model.md` | Schema, RLS, queries, migrations, seeds |
| `docs/ai-generation.md` | Generation pipeline, slide schema, prompts, credits |
| `docs/design-system.md` | Any UI work |
| `tasks/plan.md` | Before implementation, phase planning |
| `tasks/todo.md` | Executing tasks and checkpoints |

## Open questions

Tracked in `docs/spec.md` → **Open Questions**. Do not silently decide these; flag them and ask.
