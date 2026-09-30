import "server-only";
import { db } from "@/lib/db/client";
import { decks, slides, themes } from "@/lib/db/schema";
import { eq, and, isNull, asc } from "drizzle-orm";
import { SlideSchema, type Slide } from "@/lib/slides/schema";
import { ThemeTokensSchema, type ThemeTokens } from "@/lib/slides/theme";

/**
 * Public-safe deck payload — contains no internal ids beyond what the
 * audience strictly needs (slide index, type, content, theme tokens).
 * No orgId, ownerId, emails, or sensitive metadata.
 */
export interface AudiencePayload {
  deckId: string;
  title: string;
  language: string;
  slideCount: number;
  slides: Slide[];
  theme: ThemeTokens;
  presentToken: string;
}

export async function getAudiencePayload(
  presentToken: string
): Promise<AudiencePayload | null> {
  // Resolve deck by token (no auth required)
  const [deck] = await db
    .select({
      id: decks.id,
      title: decks.title,
      language: decks.language,
      themeId: decks.themeId,
      status: decks.status,
      deletedAt: decks.deletedAt,
    })
    .from(decks)
    .where(and(eq(decks.presentToken, presentToken), isNull(decks.deletedAt)))
    .limit(1);

  if (!deck) return null;

  // Resolve theme
  const [themeRow] = await db
    .select({ tokens: themes.tokens })
    .from(themes)
    .where(eq(themes.id, deck.themeId))
    .limit(1);

  const themeParsed = ThemeTokensSchema.safeParse(themeRow?.tokens);
  if (!themeParsed.success) return null;

  // Resolve slides (validate every slide; skip any invalid ones)
  const rawSlides = await db
    .select({
      id: slides.id,
      position: slides.position,
      type: slides.type,
      content: slides.content,
    })
    .from(slides)
    .where(eq(slides.deckId, deck.id))
    .orderBy(asc(slides.position));

  const parsedSlides = rawSlides.flatMap((s) => {
    const result = SlideSchema.safeParse({
      id: s.id,
      position: s.position,
      type: s.type,
      content: s.content,
      // notes and script are intentionally omitted from the audience payload
    });
    return result.success ? [result.data] : [];
  });

  if (parsedSlides.length === 0) return null;

  return {
    deckId: deck.id,
    title: deck.title,
    language: deck.language,
    slideCount: parsedSlides.length,
    slides: parsedSlides,
    theme: themeParsed.data,
    presentToken,
  };
}
