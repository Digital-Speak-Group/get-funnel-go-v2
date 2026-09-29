# GetFunnels SaaS — Kickoff Docs

Seed documentation for the new **Next.js** repository. These files are written to be handed to an AI coding agent (Kilo, Claude Code, Cursor, Copilot) as its operating context.

## How to use

1. Create the new repo (e.g. `getfunnels-saas`) — empty, `main` branch.
2. Copy the **contents** of this folder into the new repo root:

   ```
   AGENTS.md
   README.md
   docs/
   tasks/
   scripts/
   ```

3. Commit everything.
4. First prompt to the AI:

   > Read `AGENTS.md`, then `docs/spec.md`, `docs/architecture.md`, `docs/data-model.md`, `docs/ai-generation.md`, and `docs/design-system.md`. Then execute `tasks/todo.md` starting at Phase 0, following the workflow and boundaries in `AGENTS.md`. Stop at each checkpoint and ask for review.

5. Review at every checkpoint in `tasks/todo.md` before letting the agent continue.

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
