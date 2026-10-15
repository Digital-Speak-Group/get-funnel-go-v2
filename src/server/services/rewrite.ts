import { z } from "zod";
import type { AIProvider } from "@/lib/ai/provider";
import { logGeneration } from "@/lib/db/repositories/usage";
import { REWRITE_TEXT_SYSTEM_PROMPT, rewriteInstruction, type RewriteAction } from "@/server/ai/prompts/rewriteText";
import { refundCredits, reserveCredits } from "./credits";

/** Up-front reservation for one rewrite; settled to the real cost afterwards (Task 79). */
export const REWRITE_COST_CENTS = 1;

export interface RewriteInput {
  deck: { id: string; title: string; language: string };
  text: string;
  action: RewriteAction;
  instructions?: string;
  /** Character limit of the field the text goes back into. */
  maxLength: number;
}

export type RewriteResult = { ok: true; text: string } | { ok: false; error: "NO_CREDITS" | "FAILED" };

/**
 * "Réécrire" (Task 79): rewrites one text of a slide through the AI provider, under the
 * same credit ledger as generation: reserve, settle to the real cost, refund in full on failure.
 */
export async function rewriteText(
  ctx: { orgId: string; userId: string },
  input: RewriteInput,
  provider: AIProvider
): Promise<RewriteResult> {
  if (!(await reserveCredits(ctx, REWRITE_COST_CENTS))) return { ok: false, error: "NO_CREDITS" };
  const started = Date.now();
  let charged = REWRITE_COST_CENTS;

  try {
    const result = await provider.complete({
      tier: "fast",
      system: REWRITE_TEXT_SYSTEM_PROMPT,
      input: [
        `DECK: ${input.deck.title} (language: ${input.deck.language})`,
        `MAXIMUM LENGTH: ${input.maxLength} characters`,
        `<INSTRUCTION>${rewriteInstruction(input.action, input.instructions)}</INSTRUCTION>`,
        `<TEXT>${input.text}</TEXT>`,
      ].join("\n"),
      schema: z.object({ text: z.string().min(1).max(input.maxLength) }),
      temperature: input.action === "fix" ? 0 : 0.6,
      maxTokens: Math.min(1500, Math.ceil(input.maxLength / 2) + 100),
    });
    if (!result.success) throw new Error(result.error);

    const cost = result.usage.costCents;
    if (cost < REWRITE_COST_CENTS) {
      await refundCredits(ctx, REWRITE_COST_CENTS - cost);
      charged = cost;
    } else if (cost > REWRITE_COST_CENTS && (await reserveCredits(ctx, cost - REWRITE_COST_CENTS))) {
      charged = cost;
    }
    await logGeneration(ctx, {
      deckId: input.deck.id,
      // The usage log has no "rewrite" kind; a rewrite is a slide edit.
      kind: "slide",
      model: result.usage.model,
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      costCents: cost,
      status: "succeeded",
      durationMs: Date.now() - started,
    });
    return { ok: true, text: result.data.text.trim() };
  } catch (err) {
    if (charged > 0) await refundCredits(ctx, charged);
    await logGeneration(ctx, {
      deckId: input.deck.id,
      kind: "slide",
      model: "unknown",
      inputTokens: 0,
      outputTokens: 0,
      costCents: 0,
      status: "failed",
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - started,
    });
    return { ok: false, error: "FAILED" };
  }
}
