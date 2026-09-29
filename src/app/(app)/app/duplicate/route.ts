import { getSession } from "@/lib/auth/session";
import { createDeck as createDeckRepo } from "@/server/services/decks";
import { getSlidesByDeckId } from "@/lib/db/repositories/slides";
import { db } from "@/lib/db/client";
import { decks, slides } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const DuplicateSchema = z.object({
  id: z.string().uuid(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return new Response(JSON.stringify({ error: "UNAUTHENTICATED" }), { status: 401 });

  const body = await request.json();
  const parsed = DuplicateSchema.safeParse(body);
  if (!parsed.success) return new Response(JSON.stringify({ error: "INVALID_ID" }), { status: 400 });

  const [source] = await db
    .select()
    .from(decks)
    .where(eq(decks.id, parsed.data.id));

  if (!source || source.orgId !== session.activeOrgId) {
    return new Response(JSON.stringify({ error: "NOT_FOUND" }), { status: 404 });
  }

  const newDeck = await createDeckRepo(
    {
      title: `${source.title} (copie)`,
      description: source.description ?? undefined,
      themeId: source.themeId,
      templateId: source.templateId ?? undefined,
      language: source.language,
    },
    { orgId: session.activeOrgId, userId: session.userId }
  );

  // Duplicate slides
  const sourceSlides = await getSlidesByDeckId(parsed.data.id, { orgId: session.activeOrgId, userId: session.userId });

  for (const slide of sourceSlides) {
    await db.insert(slides).values({
      deckId: newDeck.id,
      position: slide.position,
      type: slide.type,
      content: slide.content,
      notes: slide.notes ?? undefined,
      script: slide.script ?? undefined,
    });
  }

  revalidatePath("/app");
  return new Response(JSON.stringify({ deck: newDeck }), { status: 200 });
}