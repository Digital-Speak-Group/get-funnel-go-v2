# Spec: GetFunnels SaaS (V1)

> Status: DRAFT — requires human review before implementation.
> Owner: Digital Speak Group. Last updated: 2026-09-21.

## Objective

Turn the internal, single-tenant `get-funnel-go` presentation app into a multi-tenant SaaS.

**What we are building**

A web app where a user pastes a sales script (or writes a brief), picks a proven funnel template and a visual theme, and AI generates a complete, editable, presenter-ready deck. The user presents it live from a presenter view while the audience follows a synced read-only view on a second screen or machine.

**Who it is for**

| Persona | Need |
|---|---|
| Freelance closer / setter | Turn a call script into a polished diagnostic deck in minutes |
| Agency (2–20 people) | Shared workspace, brand themes, consistent frameworks across closers |
| Consultant / coach | Reusable templates, presenter scripts, client-ready exports |

**Success looks like**

- A new user goes from signup to a generated, presentable 20+ slide deck in **under 10 minutes**.
- Presenter↔audience sync works across two different machines with **< 2 s** slide latency.
- ≥ 60% of generated decks are presented at least once (activation signal).
- AI generation cost per deck is **< $0.60** at V1 model prices.

**Non-goals for V1**

- Native mobile apps.
- Real-time collaborative editing of the same deck by multiple users.
- Audio/video recording, webinar hosting.
- Marketplace for third-party templates.
- Self-hosted infrastructure (that is V2; V1 must merely not block it).

## Tech Stack

- Next.js 15+ (App Router), TypeScript strict, `src/` directory
- Tailwind CSS v4, shadcn/ui, Radix, lucide-react, framer-motion
- Supabase: Postgres, Auth (`@supabase/ssr`), Storage, Realtime
- Drizzle ORM + Drizzle Kit (plain SQL migrations in `drizzle/`)
- Anthropic Claude behind an `AIProvider` interface (server-side only)
- Stripe subscriptions + credit ledger
- Resend for transactional email behind `EmailProvider`
- Zod for all validation
- Vitest + Playwright
- Deploy target V1: Vercel. Deploy target V2: Docker on a VPS (must not be blocked)

## Commands

```
npm run dev              # dev server
npm run build            # production build
npm run start            # production server
npm run lint             # eslint
npm run typecheck        # tsc --noEmit
npm run test             # vitest run
npm run test:e2e         # playwright test
npm run db:generate      # drizzle-kit generate
npm run db:migrate       # drizzle-kit migrate
npm run db:seed          # themes, system templates, demo data
npm run db:studio        # drizzle-kit studio
```

Definition of done for every task: `lint && typecheck && test && build` pass.

## Project Structure

See `AGENTS.md` → Project structure. Summary: `src/app` (routes), `src/components` (ui, app, slides, presenter), `src/lib` (db, auth, realtime, storage, ai, slides), `src/server` (services, ai pipeline), `drizzle/` (migrations), `scripts/` (seeds, content porting), `tests/`, `e2e/`, `docs/`, `tasks/`.

## Code Style

One representative snippet (server action + repository + Zod):

```ts
"use server";

import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { createDeck } from "@/lib/db/repositories/decks";

const Input = z.object({
  title: z.string().min(1).max(120),
  templateId: z.string().uuid().optional(),
  themeId: z.string().uuid(),
});

export async function createDeckAction(raw: unknown) {
  const session = await getSession();
  if (!session) return { error: "UNAUTHENTICATED" as const };

  const parsed = Input.safeParse(raw);
  if (!parsed.success) return { error: "INVALID_INPUT" as const };

  const deck = await createDeck(parsed.data, {
    orgId: session.activeOrgId,
    userId: session.userId,
  });
  return { deckId: deck.id };
}
```

Conventions: named exports; `type` over `interface` for object shapes unless declaration merging is needed; no default exports except Next.js pages/layouts; errors as discriminated unions (`{ error } | { data }`), never thrown across module boundaries; server-only modules start with `import "server-only"`.

## Testing Strategy

| Level | Tool | Scope | Location |
|---|---|---|---|
| Unit | Vitest | schemas, pure services, prompt builders, token math | `tests/unit/` |
| Integration | Vitest | repositories against a test Postgres (docker compose), route handlers | `tests/integration/` |
| E2E | Playwright | signup → generate → present → audience sync; billing checkout | `e2e/` |
| AI eval | Vitest + fixtures | golden scripts → schema-valid decks; snapshot key fields | `tests/ai/` |

Coverage expectation: **all** schema and service modules tested; UI components tested only where logic exists; e2e covers the happy path of every shipped phase. AI output correctness is enforced by schema validation + eval fixtures, not by exact-match snapshots of prose.

## Boundaries

- **Always:** validate input with Zod; org-scope every query; keep secrets server-side; run the definition of done; update docs when decisions change.
- **Ask first:** schema changes; new dependencies; auth/billing/credit changes; route or audience-link changes.
- **Never:** ship secrets to the client; query without org scoping; use Vercel/Supabase-only APIs in business logic; commit `.env*`; delete failing tests.

## Success Criteria

Testable conditions for V1 launch:

- [ ] A user can sign up, create an org, and be routed to onboarding without manual steps.
- [ ] A user can paste a script (≤ 30k characters), choose template + theme + length + tone, and receive a schema-valid deck of the requested slide count.
- [ ] Generated decks render identically across the editor, presenter view, and audience view.
- [ ] Presenter changes propagate to the audience view across two machines in < 2 s (p95).
- [ ] Audience links are token-based, revocable, and require no account.
- [ ] A user can regenerate a single slide without regenerating the deck.
- [ ] Every AI call is logged with tokens and cost; credits are deducted and refunded on failure.
- [ ] Stripe checkout upgrades a plan; webhook updates `subscriptions`; plan limits are enforced server-side.
- [ ] PDF export of a deck matches the on-screen rendering.
- [ ] E2E happy path passes in CI on every PR.
- [ ] `docker compose up` with plain Postgres runs migrations + app (V2 rehearsal) — documented gaps only.

## Resolved Decisions

| # | Decision | Outcome |
|---|---|---|
| 1 | AI provider: Claude-first behind `AIProvider`? | Yes — Anthropic Claude 3.5 Sonnet is implemented behind the interface. |
| 2 | Pricing model and V1 price points? | Implemented: Free trial (1 credit), Pro (50 credits), Agency (500 credits). |
| 3 | Billing in V1 or beta-then-billing? | Stripe is integrated in V1 for launch. |
| 4 | Keep French-only UI for V1? | Yes — French-first, strings centralized for future i18n. |
| 5 | Custom domain for audience links? | V1 uses `/p/[token]` on the main app domain. |
| 6 | Max slides per generation? | 40 (configured in template definitions). |
| 7 | Do audience viewers need lead capture (email gate before viewing)? | Deferred to V1.5 — schema leaves room for this. |
| 8 | Which legacy decks must be ported as templates first? | RDV Classique, VSL, Webinaire, Commercial ported. |
