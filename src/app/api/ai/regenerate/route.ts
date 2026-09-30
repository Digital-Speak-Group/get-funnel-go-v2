import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { GroqProvider } from "@/lib/ai/groq";
import { db } from "@/lib/db/client";
import { slides, decks, organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { reserveCredits, refundCredits } from "@/server/services/credits";
import { logGeneration } from "@/lib/db/repositories/usage";
import { GENERATE_SLIDE_SYSTEM_PROMPT } from "@/server/ai/prompts/generateSlide";
import { SlideSchema } from "@/lib/slides/schema";
import { rateLimit } from "@/lib/rate-limit";
import { analytics } from "@/lib/analytics";

const aiRateLimiter = rateLimit({ interval: 60000, limit: 5 });
const RegenerateRequestSchema = z.object({
  slideId: z.string().uuid(),
  instructions: z.string().max(500).optional(),
});

const ESTIMATED_SLIDE_COST_CENTS = 1;

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate Limiting
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const identifier = session.userId || ip;
  const rateLimitResult = await aiRateLimiter.check(identifier);
  
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too Many Requests" },
      { 
        status: 429, 
        headers: { 
          "Retry-After": Math.max(1, rateLimitResult.reset - Math.floor(Date.now() / 1000)).toString(),
          "X-RateLimit-Limit": rateLimitResult.limit.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": rateLimitResult.reset.toString(),
        } 
      }
    );
  }

  const body = await req.json();
  const parsed = RegenerateRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { slideId, instructions } = parsed.data;

  // 1. Fetch slide and deck
  const slideRows = await db.select().from(slides).where(eq(slides.id, slideId)).limit(1);
  const slide = slideRows[0];
  if (!slide) {
    return NextResponse.json({ error: "Slide not found" }, { status: 404 });
  }

  const deckRows = await db.select().from(decks).where(eq(decks.id, slide.deckId)).limit(1);
  const deck = deckRows[0];
  if (!deck || deck.orgId !== session.activeOrgId) {
    return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
  }

  // 2. Reserve credits
  const hasCredits = await reserveCredits({ orgId: session.activeOrgId }, ESTIMATED_SLIDE_COST_CENTS);
  if (!hasCredits) {
    return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
  }

  const startTime = Date.now();
  const provider = new GroqProvider();

  try {
    const [org] = await db.select({ plan: organizations.plan }).from(organizations).where(eq(organizations.id, session.activeOrgId)).limit(1);
    const plan = org?.plan || "trial";
    analytics.track("generation_started", { userId: session.userId, orgId: session.activeOrgId, plan, type: "regenerate", deckId: deck.id });

    const input = `
SLIDE TO GENERATE:
Type: ${slide.type}
Existing Content (JSON): ${JSON.stringify(slide.content)}

USER INSTRUCTIONS FOR REVISION:
${instructions || "Improve this slide based on its current content. Fix missing information."}
`;

    const result = await provider.complete({
      tier: "quality",
      system: GENERATE_SLIDE_SYSTEM_PROMPT,
      input,
      schema: SlideSchema,
      temperature: 0.7,
    });

    if (!result.success) {
      throw new Error(`Generation failed: ${result.error}`);
    }

    const newSlideData = result.data;
    
    // 3. Update DB
    await db.update(slides)
      .set({
        content: newSlideData.content,
        notes: newSlideData.notes,
        script: newSlideData.script,
      })
      .where(eq(slides.id, slideId));

    // 4. Log usage
    const cost = result.usage?.costCents ?? 0;
    
    if (cost < ESTIMATED_SLIDE_COST_CENTS) {
      await refundCredits({ orgId: session.activeOrgId }, ESTIMATED_SLIDE_COST_CENTS - cost);
    } else if (cost > ESTIMATED_SLIDE_COST_CENTS) {
      await reserveCredits({ orgId: session.activeOrgId }, cost - ESTIMATED_SLIDE_COST_CENTS);
    }

    await logGeneration(
      { orgId: session.activeOrgId, userId: session.userId },
      {
        deckId: deck.id,
        kind: "slide",
        model: result.usage?.model ?? "unknown",
        inputTokens: result.usage?.inputTokens ?? 0,
        outputTokens: result.usage?.outputTokens ?? 0,
        costCents: cost,
        status: "succeeded",
        durationMs: Date.now() - startTime,
      }
    );

    analytics.track("generation_succeeded", { userId: session.userId, orgId: session.activeOrgId, type: "regenerate", deckId: deck.id });

    return NextResponse.json({ success: true, slide: newSlideData });
  } catch (err: unknown) {
    await refundCredits({ orgId: session.activeOrgId }, ESTIMATED_SLIDE_COST_CENTS);
    await logGeneration(
      { orgId: session.activeOrgId, userId: session.userId },
      {
        deckId: deck.id,
        kind: "slide",
        model: "unknown",
        inputTokens: 0,
        outputTokens: 0,
        costCents: 0,
        status: "failed",
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - startTime,
      }
    );
    
    analytics.track("generation_failed", { userId: session.userId, orgId: session.activeOrgId, type: "regenerate", deckId: deck.id, error: err instanceof Error ? err.message : String(err) });
    
    return NextResponse.json({ error: "Failed to regenerate slide" }, { status: 500 });
  }
}
