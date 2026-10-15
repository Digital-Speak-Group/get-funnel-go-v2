import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { GroqProvider } from "@/lib/ai/groq";
import { getDeckById } from "@/lib/db/repositories/decks";
import { getRateLimitHeaders, rateLimit } from "@/lib/rate-limit";
import { REWRITE_ACTIONS } from "@/server/ai/prompts/rewriteText";
import { rewriteText } from "@/server/services/rewrite";

const rewriteLimiter = rateLimit({ interval: 60_000, limit: 20 });

const RewriteRequestSchema = z.object({
  deckId: z.string().uuid(),
  text: z.string().trim().min(1).max(2000),
  action: z.enum(REWRITE_ACTIONS),
  instructions: z.string().trim().max(300).optional(),
  maxLength: z.number().int().min(10).max(2000),
}).refine((r) => r.action !== "custom" || !!r.instructions, { message: "instructions required", path: ["instructions"] });

/**
 * POST /api/ai/rewrite (Task 79) — `{ deckId, text, action, instructions?, maxLength }` →
 * `{ text }`. The deck must belong to the caller's org; costs AI credits (402 when out).
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const limited = await rewriteLimiter.check(session.userId);
  if (!limited.success) return Response.json({ error: "RATE_LIMITED" }, { status: 429, headers: getRateLimitHeaders(limited) });

  const parsed = RewriteRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "INVALID_REQUEST" }, { status: 400 });

  const ctx = { orgId: session.activeOrgId, userId: session.userId };
  const deck = await getDeckById(parsed.data.deckId, ctx);
  if (!deck) return Response.json({ error: "NOT_FOUND" }, { status: 404 });

  const result = await rewriteText(
    ctx,
    {
      deck: { id: deck.id, title: deck.title, language: deck.language },
      text: parsed.data.text,
      action: parsed.data.action,
      instructions: parsed.data.instructions,
      maxLength: parsed.data.maxLength,
    },
    new GroqProvider()
  );
  if (!result.ok) return Response.json({ error: result.error }, { status: result.error === "NO_CREDITS" ? 402 : 502 });
  return Response.json({ text: result.text });
}
