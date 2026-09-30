import "server-only";
import { db } from "@/lib/db/client";
import { decks, slides, themes } from "@/lib/db/schema";
import { eq, and, isNull, asc } from "drizzle-orm";

export interface ExportSlide {
  id: string;
  position: number;
  type: string;
  content: unknown;
}

export interface ExportPayload {
  deckId: string;
  title: string;
  themeTokens: unknown;
  slides: ExportSlide[];
  presentToken: string;
  appUrl: string;
}

/**
 * Resolves the deck payload needed for PDF export.
 * Only accessible server-side (org-scoped).
 */
export async function getExportPayload(
  deckId: string,
  ctx: { orgId: string; userId: string }
): Promise<ExportPayload | null> {
  const [deck] = await db
    .select()
    .from(decks)
    .where(
      and(eq(decks.id, deckId), eq(decks.orgId, ctx.orgId), isNull(decks.deletedAt))
    )
    .limit(1);

  if (!deck) return null;

  const [theme] = await db
    .select({ tokens: themes.tokens })
    .from(themes)
    .where(eq(themes.id, deck.themeId))
    .limit(1);

  const deckSlides = await db
    .select({
      id: slides.id,
      position: slides.position,
      type: slides.type,
      content: slides.content,
    })
    .from(slides)
    .where(eq(slides.deckId, deckId))
    .orderBy(asc(slides.position));

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;

  return {
    deckId: deck.id,
    title: deck.title,
    themeTokens: theme?.tokens ?? null,
    slides: deckSlides,
    presentToken: deck.presentToken,
    appUrl,
  };
}
