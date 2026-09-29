# Seed Data

`fake-data.json` is the single source of fake/dev data for the app. It is deterministic: every id is a fixed UUID, so tests, screenshots, and local demos are reproducible.

## Contents

| Section | Rows | Notes |
|---|---|---|
| `organizations` | 1 | Demo org on the `pro` plan |
| `profiles` | 3 | owner / editor / viewer (French names) |
| `memberships` | 3 | Covers all three roles for permission testing |
| `themes` | 5 | System themes, all schema-valid token sets |
| `templates` | 4 | RDV Classique, VSL Funnel, Webinaire, Commercial (stage configs for AI planning) |
| `assets` | 1 | Org logo |
| `decks` | 3 | `ready` (20 slides), `draft` (12 slides), AI-generated draft (6 slides) |
| `slides` | 38 | Realistic French sales copy with presenter `notes` and `script` |
| `sessions` / `session_events` | 2 / 10 | One live session, one ended session with slide timings |
| `ai_generations` | 3 | 2 succeeded, 1 failed (refunded) — covers cost/error paths |
| `usage_counters` | 2 | Two billing periods |
| `subscriptions` | 1 | Active Stripe test-mode subscription |

## How to load

1. Create auth users for the three profiles via the Supabase admin API with the **same UUIDs** as in `profiles[].id` (`SEED_DEMO_PASSWORD` comes from env — never store passwords in this file).
2. Insert rows in FK order:

   ```
   organizations → profiles → memberships → themes → templates → assets
   → decks → slides → sessions → session_events → ai_generations
   → usage_counters → subscriptions
   ```

3. Upsert on primary key so `npm run db:seed` is idempotent.
4. Timestamps are already in the file — do not let defaults overwrite them.

## Rules

- **Do not edit ids.** Tests and fixtures reference them (e.g. `20000000-0000-4000-8000-000000000001` is the canonical deck).
- All slide `content` must validate against `SlideSchema` and themes against `ThemeTokensSchema` (`docs/ai-generation.md`).
- New fake rows follow the id prefixes already in use:
  `1…` slides · `2…` decks · `3…` profiles · `4…` themes · `5…` organizations · `6…` templates · `7…` ai_generations · `8…` subscriptions · `9…` sessions · `a…` (unused) · `b…` session_events · `c…` assets.
- Keep it French-first: this data is also used for UI screenshots and demos.
- This file is dev-only. Never load it into production.
