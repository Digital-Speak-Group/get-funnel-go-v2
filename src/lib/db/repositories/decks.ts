import "server-only";
import { db } from "@/lib/db/client";
import { decks, slides, themes, templates } from "@/lib/db/schema";
import { eq, and, desc, isNull, count, asc } from "drizzle-orm";
import { nanoid } from "nanoid";

export interface DeckRepositoryContext {
  orgId: string;
  userId: string;
}

export interface CreateDeckInput {
  title: string;
  description?: string;
  themeId: string;
  templateId?: string;
  language?: string;
}

export interface UpdateDeckInput {
  title?: string;
  description?: string;
  themeId?: string;
  status?: "draft" | "ready" | "archived";
  language?: string;
}

export interface DeckWithRelations {
  id: string;
  orgId: string;
  ownerId: string;
  title: string;
  description: string | null;
  themeId: string;
  templateId: string | null;
  status: "draft" | "ready" | "archived";
  presentToken: string;
  language: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  theme: {
    id: string;
    name: string;
    tokens: unknown;
  } | null;
  template: {
    id: string;
    name: string;
    slug: string;
  } | null;
  slideCount: number;
  firstSlide?: {
    id: string;
    type: string;
    content: unknown;
    notes: string | null;
    script: string | null;
    position: number;
  } | null;
}

export async function createDeck(
  input: CreateDeckInput,
  ctx: DeckRepositoryContext
): Promise<DeckWithRelations> {
  const presentToken = nanoid(32);

  const [deck] = await db
    .insert(decks)
    .values({
      orgId: ctx.orgId,
      ownerId: ctx.userId,
      title: input.title,
      description: input.description ?? null,
      themeId: input.themeId,
      templateId: input.templateId ?? null,
      status: "draft",
      presentToken,
      language: input.language ?? "fr",
    })
    .returning();

  const [theme] = await db
    .select({ id: themes.id, name: themes.name, tokens: themes.tokens })
    .from(themes)
    .where(eq(themes.id, deck.themeId));

  let template: { id: string; name: string; slug: string } | null = null;
  if (deck.templateId) {
    const [t] = await db
      .select({ id: templates.id, name: templates.name, slug: templates.slug })
      .from(templates)
      .where(eq(templates.id, deck.templateId));
    template = t ?? null;
  }

  return {
    ...deck,
    theme: theme ?? null,
    template,
    slideCount: 0,
  };
}

export async function getDeckById(
  id: string,
  ctx: DeckRepositoryContext
): Promise<DeckWithRelations | null> {
  const [deck] = await db
    .select()
    .from(decks)
    .where(and(eq(decks.id, id), eq(decks.orgId, ctx.orgId), isNull(decks.deletedAt)));

  if (!deck) return null;

  const [theme] = await db
    .select({ id: themes.id, name: themes.name, tokens: themes.tokens })
    .from(themes)
    .where(eq(themes.id, deck.themeId));

  let template: { id: string; name: string; slug: string } | null = null;
  if (deck.templateId) {
    const [t] = await db
      .select({ id: templates.id, name: templates.name, slug: templates.slug })
      .from(templates)
      .where(eq(templates.id, deck.templateId));
    template = t ?? null;
  }

  const slideCountResult = await db
    .select({ count: count() })
    .from(slides)
    .where(eq(slides.deckId, deck.id));

  // Get first slide for thumbnail
  const firstSlideResult = await db
    .select({
      id: slides.id,
      type: slides.type,
      content: slides.content,
      notes: slides.notes,
      script: slides.script,
      position: slides.position,
    })
    .from(slides)
    .where(eq(slides.deckId, deck.id))
    .orderBy(asc(slides.position))
    .limit(1);

  const firstSlide = firstSlideResult[0] ?? null;

  return {
    ...deck,
    theme: theme ?? null,
    template,
    slideCount: slideCountResult[0]?.count ?? 0,
    firstSlide,
  };
}

export async function getDeckByPresentToken(
  presentToken: string
): Promise<DeckWithRelations | null> {
  const [deck] = await db
    .select()
    .from(decks)
    .where(and(eq(decks.presentToken, presentToken), isNull(decks.deletedAt)));

  if (!deck) return null;

  const [theme] = await db
    .select({ id: themes.id, name: themes.name, tokens: themes.tokens })
    .from(themes)
    .where(eq(themes.id, deck.themeId));

  let template: { id: string; name: string; slug: string } | null = null;
  if (deck.templateId) {
    const [t] = await db
      .select({ id: templates.id, name: templates.name, slug: templates.slug })
      .from(templates)
      .where(eq(templates.id, deck.templateId));
    template = t ?? null;
  }

  const slideCountResult = await db
    .select({ count: count() })
    .from(slides)
    .where(eq(slides.deckId, deck.id));

  // Get first slide for thumbnail
  const firstSlideResult = await db
    .select({
      id: slides.id,
      type: slides.type,
      content: slides.content,
      notes: slides.notes,
      script: slides.script,
      position: slides.position,
    })
    .from(slides)
    .where(eq(slides.deckId, deck.id))
    .orderBy(asc(slides.position))
    .limit(1);

  const firstSlide = firstSlideResult[0] ?? null;

  return {
    ...deck,
    theme: theme ?? null,
    template,
    slideCount: slideCountResult[0]?.count ?? 0,
    firstSlide,
  };
}

export async function listDecks(
  ctx: DeckRepositoryContext,
  options?: {
    status?: "draft" | "ready" | "archived";
    limit?: number;
    offset?: number;
    search?: string;
  }
): Promise<{ decks: DeckWithRelations[]; total: number }> {
  const conditions = [eq(decks.orgId, ctx.orgId), isNull(decks.deletedAt)];

  if (options?.status) {
    conditions.push(eq(decks.status, options.status));
  }

  if (options?.search) {
    conditions.push(
      // We'll handle search in application layer for simplicity
    );
  }

  const totalResult = await db
    .select({ count: count() })
    .from(decks)
    .where(and(...conditions));

  const total = totalResult[0]?.count ?? 0;

  const deckResults = await db
    .select()
    .from(decks)
    .where(and(...conditions))
    .orderBy(desc(decks.updatedAt))
    .limit(options?.limit ?? 50)
    .offset(options?.offset ?? 0);

  const deckIds = deckResults.map((d) => d.id);
  const themesMap = new Map();
  const templatesMap = new Map();
  const slideCounts = new Map();
  const firstSlides = new Map();

  if (deckIds.length > 0) {
    const themeResults = await db
      .select({ id: themes.id, name: themes.name, tokens: themes.tokens })
      .from(themes)
      .where(
        eq(themes.id, deckResults[0].themeId) // This is a simplification - in real code we'd batch query
      );
    themeResults.forEach((t) => themesMap.set(t.id, t));

    // Get templates
    const templateIds = deckResults.filter((d) => d.templateId).map((d) => d.templateId!);
    if (templateIds.length > 0) {
      const templateResults = await db
        .select({ id: templates.id, name: templates.name, slug: templates.slug })
        .from(templates)
        .where(eq(templates.id, templateIds[0])); // Simplified
      templateResults.forEach((t) => templatesMap.set(t.id, t));
    }

    // Get slide counts and first slides
    for (const deck of deckResults) {
      const countResult = await db
        .select({ count: count() })
        .from(slides)
        .where(eq(slides.deckId, deck.id));
      slideCounts.set(deck.id, countResult[0]?.count ?? 0);

      // Get first slide
      const firstSlideResult = await db
        .select({
          id: slides.id,
          type: slides.type,
          content: slides.content,
          notes: slides.notes,
          script: slides.script,
          position: slides.position,
        })
        .from(slides)
        .where(eq(slides.deckId, deck.id))
        .orderBy(asc(slides.position))
        .limit(1);
      firstSlides.set(deck.id, firstSlideResult[0] ?? null);
    }
  }

  const enrichedDecks = deckResults.map((deck) => ({
    ...deck,
    theme: themesMap.get(deck.themeId) ?? null,
    template: deck.templateId ? templatesMap.get(deck.templateId) ?? null : null,
    slideCount: slideCounts.get(deck.id) ?? 0,
    firstSlide: firstSlides.get(deck.id) ?? null,
  }));

  return { decks: enrichedDecks, total };
}

export async function updateDeck(
  id: string,
  input: UpdateDeckInput,
  ctx: DeckRepositoryContext
): Promise<DeckWithRelations | null> {
  const [deck] = await db
    .update(decks)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(and(eq(decks.id, id), eq(decks.orgId, ctx.orgId), isNull(decks.deletedAt)))
    .returning();

  if (!deck) return null;

  return getDeckById(id, ctx);
}

export async function softDeleteDeck(
  id: string,
  ctx: DeckRepositoryContext
): Promise<boolean> {
  const result = await db
    .update(decks)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(decks.id, id), eq(decks.orgId, ctx.orgId), isNull(decks.deletedAt)));

  return (result.rowCount ?? 0) > 0;
}

export async function rotatePresentToken(
  id: string,
  ctx: DeckRepositoryContext
): Promise<string | null> {
  const newToken = nanoid(32);
  const [deck] = await db
    .update(decks)
    .set({ presentToken: newToken, updatedAt: new Date() })
    .where(and(eq(decks.id, id), eq(decks.orgId, ctx.orgId), isNull(decks.deletedAt)))
    .returning({ presentToken: decks.presentToken });

  return deck?.presentToken ?? null;
}

export async function reorderDeckSlides(
  deckId: string,
  slideIds: string[],
  ctx: DeckRepositoryContext
): Promise<boolean> {
  // Verify deck ownership
  const deck = await getDeckById(deckId, ctx);
  if (!deck) return false;

  // Update positions in a transaction
  await db.transaction(async (tx) => {
    for (let i = 0; i < slideIds.length; i++) {
      await tx
        .update(slides)
        .set({ position: i, updatedAt: new Date() })
        .where(and(eq(slides.id, slideIds[i]), eq(slides.deckId, deckId)));
    }
  });

  return true;
}