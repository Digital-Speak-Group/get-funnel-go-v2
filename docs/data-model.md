# Data Model

> Source of truth for schema, RLS, and query conventions. Schema changes require human approval (see `AGENTS.md` → Boundaries).

## Conventions

- Primary keys: `uuid` with `default gen_random_uuid()`.
- Timestamps: `timestamptz`, `created_at default now()`, `updated_at` maintained by trigger or application code (pick one — triggers recommended).
- Every tenant-owned table has `org_id uuid not null references organizations(id) on delete cascade`.
- Names: `snake_case` in SQL, `camelCase` in Drizzle definitions.
- Soft delete only where required (`decks.deleted_at`); everything else hard-deletes.
- All enums are Postgres enums or `text` + `check` constraints (Drizzle `pgEnum` preferred).
- JSON payloads (`slides.content`, `themes.tokens`, `deck_versions.snapshot`) are validated by Zod **before** insert and **after** read.

## Tables

### Identity & tenancy

```
organizations(id, name, slug unique, plan text default 'trial', stripe_customer_id, created_at, updated_at)

profiles(id uuid pk references auth.users(id) on delete cascade,
         email, full_name, avatar_url, locale default 'fr', created_at, updated_at)

memberships(org_id, user_id, role text check (role in ('owner','admin','editor','viewer')),
            created_at, primary key (org_id, user_id))

invites(id, org_id, email, role, token unique, expires_at, accepted_at, created_by, created_at)
```

### Content

```
themes(id, org_id nullable (null = system theme), name, tokens jsonb, is_system bool, created_at, updated_at)

templates(id, org_id nullable (null = system template), slug unique, name, category, description,
          theme_id nullable references themes(id), slide_count int, config jsonb,
          is_system bool, created_at, updated_at)

decks(id, org_id, owner_id references profiles(id), title, description,
      theme_id references themes(id), template_id nullable references templates(id),
      status text check (status in ('draft','ready','archived')) default 'draft',
      present_token text unique, language text default 'fr',
      deleted_at, created_at, updated_at)

slides(id, deck_id references decks(id) on delete cascade, position int, type text,
       content jsonb, notes text, script text, created_at, updated_at,
       unique (deck_id, position) deferrable initially deferred)

deck_versions(id, deck_id references decks(id) on delete cascade, version int,
              snapshot jsonb, created_by, created_at, unique (deck_id, version))
```

`slides.type` must match the discriminated union in `docs/ai-generation.md`. `content` is validated against the per-type schema. `notes` and `script` power the presenter view (ported from the legacy `SlideNotes`/`SlideScripts`).

### Sessions & realtime

```
sessions(id, deck_id, presenter_id references profiles(id), status text check (status in ('live','ended')),
         present_token text unique, started_at, ended_at, created_at)

session_events(id, session_id references sessions(id) on delete cascade, slide_index int,
               event_type text check (event_type in ('slide_view','deck_open','deck_close')),
               duration_ms int, created_at)
```

Realtime transport is Supabase broadcast; `session_events` exists for analytics and the V2 WebSocket server, not for V1 sync.

### AI & usage

```
ai_generations(id, org_id, user_id, deck_id nullable references decks(id) on delete set null,
               kind text check (kind in ('brief','plan','slides','slide','review')),
               model text, input_tokens int, output_tokens int, cost_cents numeric(10,4),
               status text check (status in ('pending','succeeded','failed')),
               error text, duration_ms int, created_at)

usage_counters(org_id, period_start date, ai_credits_used int default 0,
               decks_created int default 0, primary key (org_id, period_start))

subscriptions(id, org_id unique, stripe_customer_id, stripe_subscription_id, plan, status,
              current_period_start, current_period_end, cancel_at_period_end bool,
              created_at, updated_at)
```

### Assets

```
assets(id, org_id, deck_id nullable references decks(id) on delete cascade,
       kind text check (kind in ('logo','image','export')), storage_path, mime_type,
       width int, height int, size_bytes int, created_at)
```

## Row Level Security

RLS is enabled on **every** table. Server code connects with a role that is still subject to RLS (not service-role) so the policies are genuinely exercised.

Helper functions (security definer, stable):

```sql
create or replace function public.is_org_member(p_org_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from memberships
    where org_id = p_org_id and user_id = auth.uid()
  );
$$;

create or replace function public.has_org_role(p_org_id uuid, p_roles text[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from memberships
    where org_id = p_org_id and user_id = auth.uid() and role = any(p_roles)
  );
$$;
```

Policy pattern per tenant table:

```sql
alter table decks enable row level security;

create policy "decks_select" on decks
  for select using (public.is_org_member(org_id));

create policy "decks_insert" on decks
  for insert with check (public.has_org_role(org_id, array['owner','admin','editor']));

create policy "decks_update" on decks
  for update using (public.has_org_role(org_id, array['owner','admin','editor']));

create policy "decks_delete" on decks
  for delete using (public.has_org_role(org_id, array['owner','admin']));
```

Special cases:

- `profiles`: users read/update only their own row; org members may read co-members via a join policy.
- `themes` / `templates`: `is_system = true` rows are readable by all authenticated users; org rows follow the tenant pattern.
- `subscriptions` / `usage_counters`: readable by org owners/admins; writes only via server (service context).
- Public audience access **never** uses RLS: the audience route fetches by `present_token` in a server route and returns a sanitized payload.

## Indexes

Required for hot paths:

```
memberships(user_id)                                    -- session → orgs
decks(org_id, updated_at desc) where deleted_at is null -- dashboard list
slides(deck_id, position)                               -- deck render
sessions(deck_id, status)                               -- live session lookup
session_events(session_id, created_at)                  -- analytics
ai_generations(org_id, created_at desc)                 -- cost dashboards
ai_generations(deck_id)                                 -- deck cost history
decks(present_token) unique                             -- audience lookup
usage_counters(org_id, period_start)                    -- limits
```

## Repository Conventions (`src/lib/db`)

```ts
import "server-only";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { decks } from "@/lib/db/schema";

export async function listDecks(ctx: { orgId: string }) {
  return db
    .select()
    .from(decks)
    .where(and(eq(decks.orgId, ctx.orgId), isNull(decks.deletedAt)))
    .orderBy(desc(decks.updatedAt));
}
```

Rules:

- One file per aggregate: `repositories/decks.ts`, `repositories/slides.ts`, `repositories/usage.ts`, …
- Functions take `ctx: { orgId, userId }` first, input second; return plain rows or `null`, never throw for expected states.
- Multi-table writes (deck + slides + generation log + credits) run in `db.transaction(...)` inside a **service**, not a repository.
- No Next.js imports in `src/lib/db` or `src/server/services`.

## Migrations

- Single source: Drizzle Kit. `npm run db:generate` → SQL file in `drizzle/`.
- RLS policies and helper functions are hand-written custom SQL migrations (Drizzle supports custom migration files) so they travel with the schema.
- Every migration must be **plain Postgres** — no Supabase extensions beyond `pgcrypto`/`gen_random_uuid`.
- Migration files are reviewed and never edited after being applied.
- The V2 rehearsal (Phase 4) applies the same migration chain to a vanilla Postgres container; any failure is a bug to fix immediately.

## Seeding

`npm run db:seed` (idempotent):

1. System themes: at minimum `getfunnels-dark` (legacy purple #470C85 palette) and `getfunnels-light`, plus 3–4 themed variants (see `docs/design-system.md`).
2. System templates: port the legacy decks (RDV Classique, VSL, Webinaire, Commercial first — see spec open question #8) into `templates` + a `template_slides` JSON structure stored in `templates.config`.
3. Presenter `notes` + `script` per slide, ported from the legacy `SlideNotes.jsx` and `SlideScripts*.jsx` files.
4. Demo org + demo user + one generated deck for local development.

Seed content lives in `scripts/seed/` as typed JSON files so it is diffable and reviewable.
