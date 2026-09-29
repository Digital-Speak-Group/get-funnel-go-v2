import { z } from "zod";

export const SLIDE_TYPES = [
  "cover",
  "statement",
  "authority",
  "problem",
  "definition",
  "why",
  "objectives",
  "flow",
  "architecture",
  "capture",
  "qualification",
  "automation",
  "channel",
  "crm",
  "analytics",
  "gallery",
  "proof",
  "benefits",
  "kpi",
  "mistakes",
  "plan",
  "pricing",
  "faq",
  "comparison",
  "timeline",
  "team",
  "cta",
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
    goals: z
      .array(z.object({ label: Text(60), target: Text(60), text: Text(200) }))
      .min(2)
      .max(5),
  }),
  flow: z.object({
    headline: Text(120),
    steps: z
      .array(
        z.object({
          label: Text(40),
          title: Text(80),
          text: Text(200),
          channel: z.string().max(40).optional(),
        })
      )
      .min(3)
      .max(7),
  }),
  architecture: z.object({
    headline: Text(120),
    layers: z
      .array(z.object({ name: Text(60), items: z.array(Text(80)).min(1).max(6) }))
      .min(2)
      .max(5),
  }),
  capture: z.object({
    headline: Text(120),
    fields: z
      .array(
        z.object({
          label: Text(60),
          type: z.enum(["text", "email", "phone", "select"]),
        })
      )
      .min(1)
      .max(6),
    ctaLabel: Text(60),
  }),
  qualification: z.object({
    headline: Text(120),
    questions: z
      .array(z.object({ question: Text(160), options: z.array(Text(80)).min(2).max(5) }))
      .min(2)
      .max(5),
  }),
  automation: z.object({
    headline: Text(120),
    items: z
      .array(z.object({ trigger: Text(100), action: Text(140), delay: Text(40).optional() }))
      .min(2)
      .max(6),
  }),
  channel: z.object({
    headline: Text(120),
    channel: z.enum(["whatsapp", "email", "sms", "phone", "dm"]),
    scripts: z
      .array(z.object({ moment: Text(60), message: Text(400) }))
      .min(1)
      .max(4),
  }),
  crm: z.object({
    headline: Text(120),
    pipelines: z
      .array(z.object({ stage: Text(60), definition: Text(160) }))
      .min(3)
      .max(7),
  }),
  analytics: z.object({
    headline: Text(120),
    metrics: z
      .array(z.object({ name: Text(60), definition: Text(160), target: Text(60).optional() }))
      .min(3)
      .max(6),
  }),
  gallery: z.object({
    headline: Text(120),
    items: z
      .array(z.object({ caption: Text(120), assetId: z.string().uuid().optional() }))
      .min(2)
      .max(8),
  }),
  proof: z.object({
    headline: Text(120),
    items: z
      .array(
        z.object({
          quote: Text(300).optional(),
          name: Text(80),
          role: Text(80).optional(),
          result: Text(120).optional(),
        })
      )
      .min(1)
      .max(4),
  }),
  benefits: z.object({
    headline: Text(120),
    benefits: z.array(Bullet).min(3).max(6),
  }),
  kpi: z.object({
    headline: Text(120),
    metrics: z
      .array(z.object({ value: Text(20), label: Text(60), delta: Text(20).optional() }))
      .min(2)
      .max(4),
  }),
  mistakes: z.object({
    headline: Text(120),
    mistakes: z
      .array(z.object({ mistake: Text(120), fix: Text(160) }))
      .min(2)
      .max(5),
  }),
  plan: z.object({
    headline: Text(120),
    phases: z
      .array(
        z.object({
          name: Text(60),
          duration: Text(40).optional(),
          deliverables: z.array(Text(120)).min(1).max(6),
        })
      )
      .min(2)
      .max(5),
  }),
  pricing: z.object({
    headline: Text(120),
    tiers: z
      .array(
        z.object({
          name: Text(60),
          price: Text(40).optional(),
          features: z.array(Text(100)).min(1).max(8),
          highlight: z.boolean().optional(),
        })
      )
      .min(1)
      .max(3),
  }),
  faq: z.object({
    headline: Text(120),
    questions: z.array(z.object({ q: Text(160), a: Text(400) })).min(2).max(6),
  }),
  comparison: z.object({
    headline: Text(120),
    columns: z.array(Text(60)).min(2).max(4),
    rows: z
      .array(z.object({ label: Text(80), values: z.array(Text(80)) }))
      .min(2)
      .max(6),
  }),
  timeline: z.object({
    headline: Text(120),
    milestones: z
      .array(z.object({ when: Text(40), title: Text(80), text: Text(160).optional() }))
      .min(2)
      .max(6),
  }),
  team: z.object({
    headline: Text(120),
    members: z
      .array(z.object({ name: Text(80), role: Text(80), proof: Text(160).optional() }))
      .min(1)
      .max(6),
  }),
  cta: z.object({
    headline: Text(120),
    sub: Text(240).optional(),
    actions: z
      .array(
        z.object({
          label: Text(60),
          kind: z.enum(["calendar", "link", "whatsapp", "form"]),
        })
      )
      .min(1)
      .max(2),
  }),
} as const;

const base = z.object({
  id: z.string().uuid(),
  position: z.number().int().min(0),
  type: z.enum(SLIDE_TYPES),
  notes: z.string().max(2000).optional(),
  script: z.string().max(4000).optional(),
});

const slideSchemas = SLIDE_TYPES.map((t) =>
  base.extend({ type: z.literal(t), content: content[t] })
);

export const SlideSchema = z.discriminatedUnion(
  "type",
  slideSchemas as [typeof slideSchemas[0], ...typeof slideSchemas],
);

export const DeckSchema = z.object({
  title: Text(120),
  language: z.string().length(2),
  slides: z.array(SlideSchema).min(5).max(40),
});

export type Slide = z.infer<typeof SlideSchema>;
export type Deck = z.infer<typeof DeckSchema>;