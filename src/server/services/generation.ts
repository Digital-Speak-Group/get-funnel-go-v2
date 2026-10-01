import { logger } from "@/lib/logger";
import type { AIProvider } from "@/lib/ai/provider";
import { reserveCredits, refundCredits } from "./credits";
import { extractBrief } from "../ai/stages/extractBrief";
import { planDeck, type TemplateConfig } from "../ai/stages/planDeck";
import { generateSlides } from "../ai/stages/generateSlides";
import type { Brief, SlidePlan } from "../ai/schema";
import type { Slide } from "@/lib/slides/schema";
import { logGeneration } from "@/lib/db/repositories/usage";
import { db } from "@/lib/db/client";
import { decks, slides } from "@/lib/db/schema";

const ESTIMATED_COST_CENTS = 5; // Reserve 5 cents upfront

export async function generateDeckFromScript(
  ctx: { orgId: string; userId: string },
  provider: AIProvider,
  script: string,
  templateConfig: TemplateConfig,
  themeId: string,
  options: { slideCount: number; tone?: string },
  onProgress?: (msg: string) => void
) {
  logger.info("Starting deck generation", { orgId: ctx.orgId, templateId: templateConfig.id });
  // 1. Reserve credits
  if (onProgress) onProgress(JSON.stringify({ status: "RESERVING_CREDITS" }));
  const hasCredits = await reserveCredits(ctx, ESTIMATED_COST_CENTS);
  if (!hasCredits) {
    logger.warn("Deck generation blocked: insufficient credits", { orgId: ctx.orgId });
    throw new Error("Insufficient AI credits");
  }

  const startTime = Date.now();
  let accumulatedCost = 0;
  let briefData: Brief | null = null;
  let planData: SlidePlan[] | null = null;
  let slidesData: Slide[] | null = null;

  try {
    // 2. Extract Brief
    if (onProgress) onProgress(JSON.stringify({ status: "EXTRACTING_BRIEF" }));
    const briefRes = await extractBrief(provider, script);
    briefData = briefRes.brief;
    const briefUsage = briefRes.usage ?? { costCents: 0, model: "unknown", inputTokens: 0, outputTokens: 0 };
    accumulatedCost += briefUsage.costCents;
    logger.debug("Brief extracted", { orgId: ctx.orgId, costCents: briefUsage.costCents });
    await logGeneration(ctx, {
      kind: "brief",
      model: briefUsage.model,
      inputTokens: briefUsage.inputTokens,
      outputTokens: briefUsage.outputTokens,
      costCents: briefUsage.costCents,
      status: "succeeded",
      durationMs: Date.now() - startTime,
    });

    // 3. Plan Deck
    if (onProgress) onProgress(JSON.stringify({ status: "PLANNING_DECK" }));
    const planStartTime = Date.now();
    const planRes = await planDeck(provider, briefData, templateConfig, options);
    planData = planRes.plan;
    const planUsage = planRes.usage ?? { costCents: 0, model: "unknown", inputTokens: 0, outputTokens: 0 };
    accumulatedCost += planUsage.costCents;
    logger.debug("Deck planned", { orgId: ctx.orgId, slideCount: planData.length });
    await logGeneration(ctx, {
      kind: "plan",
      model: planUsage.model,
      inputTokens: planUsage.inputTokens,
      outputTokens: planUsage.outputTokens,
      costCents: planUsage.costCents,
      status: "succeeded",
      durationMs: Date.now() - planStartTime,
    });

    // 4. Generate Slides
    if (onProgress) onProgress(JSON.stringify({ status: "GENERATING_SLIDES", progress: 0 }));
    const slidesStartTime = Date.now();
    const slidesRes = await generateSlides(provider, script, briefData, planData, (prog) => {
      if (onProgress) {
        onProgress(JSON.stringify({ status: "GENERATING_SLIDES", progress: prog.completed, total: prog.total }));
      }
    });
    slidesData = slidesRes.slides;
    accumulatedCost += slidesRes.usage.costCents;
    logger.debug("Slides generated", { orgId: ctx.orgId, slideCount: slidesData.length });
    
    // Refund difference if we spent less than reserved
    if (accumulatedCost < ESTIMATED_COST_CENTS) {
      await refundCredits(ctx, ESTIMATED_COST_CENTS - accumulatedCost);
    } else if (accumulatedCost > ESTIMATED_COST_CENTS) {
      // Charge the difference (naive approach)
      await reserveCredits(ctx, accumulatedCost - ESTIMATED_COST_CENTS);
    }

    if (onProgress) onProgress(JSON.stringify({ status: "SAVING_DECK" }));

    // 5. Transaction: Save deck, slides, and final log
    if (!briefData) {
      throw new Error("Missing brief data");
    }

    const deckId = crypto.randomUUID();
    await db.transaction(async (tx) => {
      await tx.insert(decks).values({
        id: deckId,
        orgId: ctx.orgId,
        ownerId: ctx.userId,
        title: briefData!.offer,
        description: `For ${briefData!.audience}`,
        themeId,
        templateId: templateConfig.id,
        status: "draft",
        presentToken: crypto.randomUUID(),
        language: briefData!.language,
      });

      if (slidesData && slidesData.length > 0) {
        await tx.insert(slides).values(
          slidesData.map((s) => ({
            id: s.id,
            deckId,
            position: s.position,
            type: s.type,
            content: s.content,
            notes: s.notes,
            script: s.script,
          }))
        );
      }
    });
    
    await logGeneration(ctx, {
      deckId,
      kind: "slides",
      model: slidesRes.usage.model,
      inputTokens: slidesRes.usage.inputTokens,
      outputTokens: slidesRes.usage.outputTokens,
      costCents: slidesRes.usage.costCents,
      status: "succeeded",
      durationMs: Date.now() - slidesStartTime,
    });

    if (onProgress) onProgress(JSON.stringify({ status: "DONE", deckId }));
    
    logger.info("Deck generation completed successfully", { orgId: ctx.orgId, deckId });
    return deckId;
  } catch (err: unknown) {
    logger.error("Deck generation failed", err, { orgId: ctx.orgId });
    if (onProgress) onProgress(JSON.stringify({ status: "ERROR", error: err instanceof Error ? err.message : String(err) }));
    // Refund all reserved if failed early
    await refundCredits(ctx, ESTIMATED_COST_CENTS);
    await logGeneration(ctx, {
      kind: "slides",
      model: "unknown",
      inputTokens: 0,
      outputTokens: 0,
      costCents: 0,
      status: "failed",
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - startTime,
    });
    throw err;
  }
}
