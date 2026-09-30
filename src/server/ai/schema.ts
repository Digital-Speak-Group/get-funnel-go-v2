import { z } from "zod";

export const BriefSchema = z.object({
  offer: z.string().describe("What is the product or service being sold?"),
  audience: z.string().describe("Who is the target audience?"),
  pains: z.array(z.string()).describe("What are the main pain points the audience is experiencing?"),
  proof: z.array(z.string()).describe("What evidence, testimonials, or data points prove the offer works?"),
  cta: z.string().describe("What is the final call to action?"),
  tone: z.enum(["professional", "urgent", "empathetic", "authoritative", "casual"]).describe("The dominant tone of the script."),
  language: z.string().length(2).describe("The 2-letter ISO language code of the script (e.g., 'fr', 'en')."),
  confidence: z.number().min(0).max(1).describe("Confidence score (0-1) that this is actually a sales script."),
});

export type Brief = z.infer<typeof BriefSchema>;

export const SlidePlanSchema = z.object({
  type: z.string().describe("The exact canonical slide type from the schema (e.g., 'cover', 'problem', 'solution', 'cta')."),
  headline: z.string().describe("The core message or headline for this slide (1-2 sentences)."),
  purpose: z.string().describe("The goal of this slide in the narrative."),
});

export type SlidePlan = z.infer<typeof SlidePlanSchema>;
