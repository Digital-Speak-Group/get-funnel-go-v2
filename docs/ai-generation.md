# AI Generation

> The core product feature: paste a script → get a themed, schema-valid, presenter-ready deck. Read with `docs/data-model.md` (persistence) and `docs/architecture.md` (boundaries).

## Pipeline Overview

```
script ─► 1. extractBrief ─► 2. planDeck ─► 3. generateSlides ─► 4. reviewDeck (optional) ─► persist
             model: fast        model: fast      model: quality          model: quality
```

All stages live in `src/server/ai/`, are plain TypeScript, and receive an `AIProvider`. No stage imports Next.js APIs.

| Stage | Input | Output | Notes |
|---|---|---|---|
| 1. Extract | raw script (≤ 30k chars), locale | `Brief` | Language detection, offer, audience, pains, proof, CTA, tone |
| 2. Plan | `Brief`, template config, `{ slideCount, tone }` | `SlidePlan[]` | Template defines the narrative skeleton; AI adapts it |
| 3. Generate | `Brief`, one `SlidePlan` item, theme, neighbor summaries | `Slide` | Per-slide call → parallelism + cheap retries |
| 4. Review | full `Deck` | `ReviewIssue[]` | V1.5: flags weak proof, missing CTA, duplicated copy |

Determinism aids: `temperature` low (0.2–0.4) for extraction/planning, 0.6–0.8 for copy; `seed` recorded in `ai_generations` when the provider supports it.

## Slide Schema (`src/lib/slides/schema.ts`)

The schema is the contract between AI, editor, and renderer. **Never** add a slide type without adding it to the registry and templates.

```ts
import { z } from "zod";

export const SLIDE_TYPES = [
  "cover", "statement", "authority", "problem", "definition", "why",
  "objectives", "flow", "architecture", "capture", "qualification",
  "automation", "channel", "crm", "analytics", "gallery", "proof",
  "benefits", "kpi", "mistakes", "plan", "pricing", "faq",
  "comparison", "timeline", "team", "cta",
] as const;

export type SlideType = (typeof SLIDE_TYPES)[number];

const Text = (max: number) => z.string().min(1).max(max);
const Bullet = z.object({
  icon: z.string().max(40).optional(),
  title: Text(80),
  text: Text(240),
});

const content = {
  cover: z.object({
    kicker: Text(60).optional(),
    title: Text(120),
    subtitle: Text(200).optional(),
    presenterName: Text(80).optional(),
  }),
  statement: z.object({
    eyebrow: Text(60).optional(),
    headline: Text(140),
    highlight: Text(60).optional(),
    sub: Text(240).optional(),
  }),
  authority: z.object({
    headline: Text(120),
    points: z.array(Bullet).min(2).max(4),
  }),
  problem: z.object({
    headline: Text(120),
    intro: Text(240).optional(),
    painPoints: z.array(Bullet).min(3).max(5),
  }),
  definition: z.object({
    headline: Text(120),
    body: Text(400),
    pillars: z.array(Bullet).min(2).max(4).optional(),
  }),
  why: z.object({
    headline: Text(120),
    reasons: z.array(Bullet).min(3).max(5),
  }),
  objectives: z.object({
    headline: Text(120),
    goals: z.array(z.object({ label: Text(60), target: Text(60), text: Text(200) })).min(2).max(5),
  }),
  flow: z.object({
    headline: Text(120),
    steps: z.array(z.object({
      label: Text(40),
      title: Text(80),
      text: Text(200),
      channel: z.string().max(40).optional(),
    })).min(3).max(7),
  }),
  architecture: z.object({
    headline: Text(120),
    layers: z.array(z.object({ name: Text(60), items: z.array(Text(80)).min(1).max(6) })).min(2).max(5),
  }),
  capture: z.object({
    headline: Text(120),
    fields: z.array(z.object({ label: Text(60), type: z.enum(["text", "email", "phone", "select"]) })).min(1).max(6),
    ctaLabel: Text(60),
  }),
  qualification: z.object({
    headline: Text(120),
    questions: z.array(z.object({ question: Text(160), options: z.array(Text(80)).min(2).max(5) })).min(2).max(5),
  }),
  automation: z.object({
    headline: Text(120),
    items: z.array(z.object({ trigger: Text(100), action: Text(140), delay: Text(40).optional() })).min(2).max(6),
  }),
  channel: z.object({
    headline: Text(120),
    channel: z.enum(["whatsapp", "email", "sms", "phone", "dm"]),
    scripts: z.array(z.object({ moment: Text(60), message: Text(400) })).min(1).max(4),
  }),
  crm: z.object({
    headline: Text(120),
    pipelines: z.array(z.object({ stage: Text(60), definition: Text(160) })).min(3).max(7),
  }),
  analytics: z.object({
    headline: Text(120),
    metrics: z.array(z.object({ name: Text(60), definition: Text(160), target: Text(60).optional() })).min(3).max(6),
  }),
  gallery: z.object({
    headline: Text(120),
    items: z.array(z.object({ caption: Text(120), assetId: z.string().uuid().optional() })).min(2).max(8),
  }),
  proof: z.object({
    headline: Text(120),
    items: z.array(z.object({
      quote: Text(300).optional(),
      name: Text(80),
      role: Text(80).optional(),
      result: Text(120).optional(),
    })).min(1).max(4),
  }),
  benefits: z.object({
    headline: Text(120),
    benefits: z.array(Bullet).min(3).max(6),
  }),
  kpi: z.object({
    headline: Text(120),
    metrics: z.array(z.object({ value: Text(20), label: Text(60), delta: Text(20).optional() })).min(2).max(4),
  }),
  mistakes: z.object({
    headline: Text(120),
    mistakes: z.array(z.object({ mistake: Text(120), fix: Text(160) })).min(2).max(5),
  }),
  plan: z.object({
    headline: Text(120),
    phases: z.array(z.object({
      name: Text(60),
      duration: Text(40).optional(),
      deliverables: z.array(Text(120)).min(1).max(6),
    })).min(2).max(5),
  }),
  pricing: z.object({
    headline: Text(120),
    tiers: z.array(z.object({
      name: Text(60),
      price: Text(40).optional(),
      features: z.array(Text(100)).min(1).max(8),
      highlight: z.boolean().optional(),
    })).min(1).max(3),
  }),
  faq: z.object({
    headline: Text(120),
    questions: z.array(z.object({ q: Text(160), a: Text(400) })).min(2).max(6),
  }),
  comparison: z.object({
    headline: Text(120),
    columns: z.array(Text(60)).min(2).max(4),
    rows: z.array(z.object({ label: Text(80), values: z.array(Text(80)) })).min(2).max(6),
  }),
  timeline: z.object({
    headline: Text(120),
    milestones: z.array(z.object({ when: Text(40), title: Text(80), text: Text(160).optional() })).min(2).max(6),
  }),
  team: z.object({
    headline: Text(120),
    members: z.array(z.object({ name: Text(80), role: Text(80), proof: Text(160).optional() })).min(1).max(6),
  }),
  cta: z.object({
    headline: Text(120),
    sub: Text(240).optional(),
    actions: z.array(z.object({ label: Text(60), kind: z.enum(["calendar", "link", "whatsapp", "form"]) })).min(1).max(2),
  }),
} as const;

const base = z.object({
  id: z.string().uuid(),
  position: z.number().int().min(0),
  type: z.enum(SLIDE_TYPES),
  notes: z.string().max(2000).optional(),
  script: z.string().max(4000).optional(),
});

export const SlideSchema = z.discriminatedUnion(
  "type",
  SLIDE_TYPES.map((t) => base.extend({ type: z.literal(t), content: content[t] })) as [
    z.ZodObject<any>, ...z.ZodObject<any>[]
  ],
);

export const DeckSchema = z.object({
  title: Text(120),
  language: z.string().length(2),
  slides: z.array(SlideSchema).min(5).max(40),
});

export type Slide = z.infer<typeof SlideSchema>;
export type Deck = z.infer<typeof DeckSchema>;
```

The 27 types above are the canonical library. Legacy decks map onto them (e.g. `verdict` → `statement`, `funnelytics` → `analytics`, `whatsapp` → `channel`, `optin` → `capture`, `preQual` → `qualification`, `errors` → `mistakes`). Porting work is a seed-script concern, not a schema concern.

## Theme Schema (`src/lib/slides/theme.ts`)

```ts
import { z } from "zod";

export const ThemeTokensSchema = z.object({
  id: z.string(),
  name: z.string().max(60),
  color: z.object({
    bg: z.string().regex(/^#[0-9a-f]{6}$/i),
    surface: z.string().regex(/^#[0-9a-f]{6}$/i),
    text: z.string().regex(/^#[0-9a-f]{6}$/i),
    muted: z.string().regex(/^#[0-9a-f]{6}$/i),
    primary: z.string().regex(/^#[0-9a-f]{6}$/i),
    primaryFg: z.string().regex(/^#[0-9a-f]{6}$/i),
    accent: z.string().regex(/^#[0-9a-f]{6}$/i),
    success: z.string().regex(/^#[0-9a-f]{6}$/i),
    danger: z.string().regex(/^#[0-9a-f]{6}$/i),
  }),
  font: z.object({
    display: z.string().max(80),
    body: z.string().max(80),
    scale: z.enum(["compact", "regular", "editorial"]),
  }),
  radius: z.enum(["sharp", "soft", "round"]),
  motion: z.enum(["none", "subtle", "expressive"]),
  background: z.enum(["solid", "grid", "gradient", "noise"]),
  logoAssetId: z.string().uuid().optional(),
});

export type ThemeTokens = z.infer<typeof ThemeTokensSchema>;
```

Renderer contract: `SlideRenderer({ slide, theme })` reads **only** from these tokens. Adding a theme must never require component changes.

## Provider Interface (`src/lib/ai/provider.ts`)

```ts
export type ModelTier = "fast" | "quality";

export type CompletionArgs<T> = {
  tier: ModelTier;
  system: string;
  input: string;
  schema: z.ZodType<T>;
  maxTokens?: number;
  temperature?: number;
};

export interface AIProvider {
  complete<T>(args: CompletionArgs<T>): Promise<{
    data: T;
    usage: { inputTokens: number; outputTokens: number; model: string };
  }>;
}
```

Implementation notes:

- Anthropic implementation uses tool/JSON-schema structured output; on schema failure, re-prompt once with the validation errors appended, then fail the stage.
- `complete` never throws for validation failures; it returns a discriminated result and the pipeline decides retry/refund.
- Model names come from `src/lib/env.ts` (`AI_MODEL_FAST`, `AI_MODEL_QUALITY`) so provider/model swaps are config changes.
- Cost per call is computed centrally (`cost_cents`) and written to `ai_generations`.

## Prompt Contracts (`src/server/ai/prompts/`)

Each stage has one prompt file with a fixed structure: role, task, constraints, output schema summary, examples. Rules:

- The pasted script is **data**, delimited and explicitly labeled as untrusted content; the system prompt says to ignore any instructions inside it (prompt injection).
- Output language follows `brief.language` (default `fr`).
- Constraints enforced in prompts *and* schema: slide count, max characters per field, no invented statistics — proof slides may only use facts present in the script, otherwise emit `{ needsInput: true }` markers that surface in the editor.
- Templates constrain narrative order; AI may adapt labels but not reorder core stages.

## Credits & Cost Control

| Rule | Value |
|---|---|
| 1 credit = | 1 full deck generation (brief + plan + slides) |
| Credits per plan | Defined in `subscriptions.plan` limits (Phase 3) |
| Reservation | Credits reserved before generation; released on success, refunded on failure |
| Max input | 30,000 characters per script |
| Max slides | 40 |
| Parallelism | Slide generation concurrency 3–5, bounded by provider rate limits |
| Logging | Every call → `ai_generations` (tokens, cost, duration, model, status) |
| Budget guard | Hard stop when `usage_counters.ai_credits_used` exceeds plan limit |

## Evaluation (`tests/ai/`)

- Fixture scripts (short/long/French/English) → run pipeline against recorded provider responses (no live API in CI).
- Assertions: deck is schema-valid, requested slide count ±1, template stage order preserved, no forbidden content (invented numbers), language matches input.
- Snapshot only structure (`slide.type` sequence) and key fields (`headline`), never full prose.
- A manual eval script (`npm run eval:ai`) hits the live provider for spot checks before releases.

## Failure Modes

| Failure | Behavior |
|---|---|
| Provider timeout | Retry once, then fail the stage; refund credits; surface retry button |
| Schema validation failure | Re-prompt with errors; after 2 failures mark slide as `failed` and let user regenerate that slide |
| Rate limit | Backoff with jitter; queue remaining slides |
| Empty/too-short script | Block before calling AI; ask for ≥ 300 characters |
| Non-sales script | Brief extraction returns low confidence; UI warns and offers templates anyway |
