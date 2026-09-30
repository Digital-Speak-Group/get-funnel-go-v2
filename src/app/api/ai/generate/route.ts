import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { generateDeckFromScript } from "@/server/services/generation";
import { GroqProvider } from "@/lib/ai/groq";
import { rateLimit } from "@/lib/rate-limit";
import { analytics } from "@/lib/analytics";
import { db } from "@/lib/db/client";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const aiRateLimiter = rateLimit({ interval: 60000, limit: 5 });

const GenerateRequestSchema = z.object({
  script: z.string().min(300).max(30000),
  themeId: z.string().uuid(),
  templateConfig: z.object({
    id: z.string(),
    name: z.string(),
    stages: z.array(z.string()),
  }),
  options: z.object({
    slideCount: z.number().int().min(5).max(40),
    tone: z.string().optional(),
  }),
});

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
  const parsed = GenerateRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { script, themeId, templateConfig, options } = parsed.data;
  
  // We will stream back server-sent events
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: string) => {
        controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
      };

      try {
        const [org] = await db.select({ plan: organizations.plan }).from(organizations).where(eq(organizations.id, session.activeOrgId)).limit(1);
        const plan = org?.plan || "trial";

        analytics.track("generation_started", { userId: session.userId, orgId: session.activeOrgId, plan });

        const provider = new GroqProvider();
        await generateDeckFromScript(
          { orgId: session.activeOrgId, userId: session.userId },
          provider,
          script,
          templateConfig,
          themeId,
          options,
          (msg) => {
            sendEvent(msg);
          }
        );
        analytics.track("generation_succeeded", { userId: session.userId, orgId: session.activeOrgId });
      } catch (err: unknown) {
        analytics.track("generation_failed", { userId: session.userId, orgId: session.activeOrgId, error: err instanceof Error ? err.message : String(err) });
        sendEvent(JSON.stringify({ status: "ERROR", error: err instanceof Error ? err.message : String(err) }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
