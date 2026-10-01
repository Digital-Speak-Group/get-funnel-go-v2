# GetFunnels SaaS — Kickoff Docs

Seed documentation for the new **Next.js** repository. These files are written to be handed to an AI coding agent (Kilo, Claude Code, Cursor, Copilot) as its operating context.

## Local Setup (V1)

1. **Clone and Install:**
   ```bash
   git clone <repo_url> getfunnels-saas
   cd getfunnels-saas
   npm install
   ```

2. **Environment Variables:**
   Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` (Supabase Postgres or local Docker)
   - `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`
   - `ANTHROPIC_API_KEY` (Claude API)
   - `AUTH_SECRET` (For Auth.js or NextAuth)

3. **Database Setup:**
   Start your local database (if using Docker) or use Supabase:
   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

4. **Run the App:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

## Files

| File | Purpose |
|---|---|
| `AGENTS.md` | Operating manual: stack, commands, structure, conventions, boundaries, definition of done. Read first. |
| `docs/spec.md` | What we are building and why. Six spec areas, success criteria, open questions. |
| `docs/architecture.md` | Module boundaries, request flows, security model, Supabase → VPS Postgres migration seams, ADR list. |
| `docs/data-model.md` | Tables, columns, RLS policies, indexes, Drizzle/migration conventions, seed strategy. |
| `docs/ai-generation.md` | Script → deck AI pipeline, slide JSON schema, theme tokens schema, provider interface, prompts, cost controls. |
| `docs/design-system.md` | Design tokens, deck themes, slide grid, motion, accessibility, surfaces to design. |
| `tasks/plan.md` | Phased implementation plan, dependency graph, risks, parallelization. |
| `tasks/todo.md` | Task list with acceptance criteria, verification steps, files, dependencies. |
| `scripts/seed/fake-data.json` | Deterministic fake data: demo org, users, themes, templates, 3 decks / 38 slides, sessions, AI logs, usage, subscription. |
| `scripts/seed/README.md` | How to load the seed data, id conventions, rules. |

## Context discipline for agents

Load documents progressively, not all at once:

- **Always:** `AGENTS.md`.
- **Before planning/architecture work:** `docs/spec.md` + `docs/architecture.md`.
- **Before touching schema or queries:** `docs/data-model.md`.
- **Before AI work:** `docs/ai-generation.md`.
- **Before any UI work:** `docs/design-system.md`.
- **Before working with demo/test data:** `scripts/seed/README.md`.
- **Before implementation:** `tasks/plan.md`, then the current phase of `tasks/todo.md`.

When a decision changes, update the relevant doc **before** implementing — docs are the source of truth.
