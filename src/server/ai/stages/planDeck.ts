import type { AIProvider, CompletionUsage } from "@/lib/ai/provider";
import { z } from "zod";
import { SlidePlanSchema, type Brief, type SlidePlan } from "../schema";
import { PLAN_DECK_SYSTEM_PROMPT } from "../prompts/planDeck";

export type TemplateConfig = {
  id: string;
  name: string;
  stages: string[];
};

export async function planDeck(
  provider: AIProvider,
  brief: Brief,
  templateConfig: TemplateConfig,
  options: { slideCount: number; tone?: string }
): Promise<{ plan: SlidePlan[]; usage: CompletionUsage | undefined }> {
  const input = `
BRIEF:
Offer: ${brief.offer}
Audience: ${brief.audience}
Pains: ${brief.pains.join("; ")}
Proof: ${brief.proof.join("; ")}
CTA: ${brief.cta}
Tone: ${options.tone ?? brief.tone}

TEMPLATE STAGES (Must preserve this order!):
${templateConfig.stages.map((s, i) => `${i + 1}. ${s}`).join("\n")}

CONSTRAINTS:
Target Slide Count: ${options.slideCount}
`;

  const result = await provider.complete({
    tier: "fast",
    system: PLAN_DECK_SYSTEM_PROMPT,
    input,
    schema: z.object({ plan: z.array(SlidePlanSchema) }),
    temperature: 0.2, // low temp for planning
  });

  if (!result.success) {
    throw new Error(`Failed to plan deck: ${result.error}`);
  }

  return {
    plan: result.data.plan,
    usage: result.usage,
  };
}
