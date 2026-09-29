import "server-only";
import { db } from "@/lib/db/client";
import {
  decks,
  slides,
  deckVersions,
  templates,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import {
  createDeck as createDeckRepo,
  getDeckById as getDeckByIdRepo,
  getDeckByPresentToken as getDeckByPresentTokenRepo,
  listDecks as listDecksRepo,
  updateDeck as updateDeckRepo,
  softDeleteDeck as softDeleteDeckRepo,
  rotatePresentToken as rotatePresentTokenRepo,
  type CreateDeckInput,
  type UpdateDeckInput,
  type DeckWithRelations,
} from "@/lib/db/repositories/decks";
import {
  getSlidesByDeckId as getSlidesByDeckIdRepo,
  reorderSlides as reorderSlidesRepo,
} from "@/lib/db/repositories/slides";

export interface DeckServiceContext {
  orgId: string;
  userId: string;
}

export interface DeckFromTemplateInput {
  title: string;
  description?: string;
  templateId: string;
  themeId?: string;
  language?: string;
}

export async function createDeck(
  input: CreateDeckInput,
  ctx: DeckServiceContext
): Promise<DeckWithRelations> {
  return createDeckRepo(input, ctx);
}

export async function createDeckFromTemplate(
  input: DeckFromTemplateInput,
  ctx: DeckServiceContext
): Promise<DeckWithRelations> {
  // Get template with slides
  const [template] = await db
    .select()
    .from(templates)
    .where(and(eq(templates.id, input.templateId), eq(templates.isSystem, true)));

  if (!template) {
    throw new Error("Template not found");
  }

  // Get template slides from config
  const templateConfig = template.config as { slides?: Array<{ type: string; content: Record<string, unknown>; notes?: string; script?: string }> };
  const templateSlides = templateConfig.slides ?? [];

  // Create deck
  const deck = await createDeckRepo(
    {
      title: input.title,
      description: input.description ?? template.description ?? undefined,
      themeId: input.themeId ?? template.themeId ?? "",
      templateId: input.templateId,
      language: input.language ?? "fr",
    },
    ctx
  );

  // Create slides from template
  if (templateSlides.length > 0) {
    for (let i = 0; i < templateSlides.length; i++) {
      const ts = templateSlides[i];
      await db
        .insert(slides)
        .values({
          deckId: deck.id,
          position: i,
          type: ts.type,
          content: ts.content,
          notes: ts.notes ?? null,
          script: ts.script ?? null,
        });
    }
  }

  return getDeckById(deck.id, ctx) as Promise<DeckWithRelations>;
}

export async function getDeckById(
  id: string,
  ctx: DeckServiceContext
): Promise<DeckWithRelations | null> {
  return getDeckByIdRepo(id, ctx);
}

export async function getDeckByPresentToken(
  presentToken: string
): Promise<DeckWithRelations | null> {
  return getDeckByPresentTokenRepo(presentToken);
}

export async function listDecks(
  ctx: DeckServiceContext,
  options?: {
    status?: "draft" | "ready" | "archived";
    limit?: number;
    offset?: number;
  }
): Promise<{ decks: DeckWithRelations[]; total: number }> {
  const result = await listDecksRepo(ctx, options);
  // Enrich with slides count (already done in repo)
  return result;
}

export async function updateDeck(
  id: string,
  input: UpdateDeckInput,
  ctx: DeckServiceContext
): Promise<DeckWithRelations | null> {
  return updateDeckRepo(id, input, ctx);
}

export async function deleteDeck(
  id: string,
  ctx: DeckServiceContext
): Promise<boolean> {
  return softDeleteDeckRepo(id, ctx);
}

export async function softDeleteDeck(
  id: string,
  ctx: DeckServiceContext
): Promise<boolean> {
  return softDeleteDeckRepo(id, ctx);
}

export async function duplicateDeck(
  id: string,
  ctx: DeckServiceContext
): Promise<DeckWithRelations | null> {
  const source = await getDeckById(id, ctx);
  if (!source) return null;

  const newDeck = await createDeckRepo(
    {
      title: `${source.title} (copie)`,
      description: source.description ?? undefined,
      themeId: source.themeId,
      templateId: source.templateId ?? undefined,
      language: source.language,
    },
    ctx
  );

  // Duplicate slides
  const sourceSlides = await getSlidesByDeckIdRepo(id, ctx);

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

  return getDeckById(newDeck.id, ctx);
}

export async function publishDeck(
  id: string,
  ctx: DeckServiceContext
): Promise<DeckWithRelations | null> {
  // Create version snapshot before publishing
  const deck = await getDeckById(id, ctx);
  if (!deck) return null;

  const slideList = await getSlidesByDeckIdRepo(id, ctx);
  const version = await getNextVersionNumber(id);

  await db.insert(deckVersions).values({
    deckId: id,
    version,
    snapshot: {
      deck: {
        title: deck.title,
        description: deck.description,
        themeId: deck.themeId,
        language: deck.language,
      },
      slides: slideList.map((s) => ({
        position: s.position,
        type: s.type,
        content: s.content,
        notes: s.notes ?? undefined,
        script: s.script ?? undefined,
      })),
    },
    createdBy: ctx.userId,
  });

  return updateDeckRepo(id, { status: "ready" }, ctx);
}

export async function restoreVersion(
  deckId: string,
  version: number,
  ctx: DeckServiceContext
): Promise<DeckWithRelations | null> {
  const [versionRecord] = await db
    .select()
    .from(deckVersions)
    .where(and(eq(deckVersions.deckId, deckId), eq(deckVersions.version, version)));

  if (!versionRecord) return null;

  const snapshot = versionRecord.snapshot as {
    deck: { title: string; description: string | null; themeId: string; language: string };
    slides: Array<{ position: number; type: string; content: Record<string, unknown>; notes?: string; script?: string }>;
  };

  // Update deck
  await db
    .update(decks)
    .set({
      title: snapshot.deck.title,
      description: snapshot.deck.description,
      themeId: snapshot.deck.themeId,
      language: snapshot.deck.language,
      updatedAt: new Date(),
    })
    .where(and(eq(decks.id, deckId), eq(decks.orgId, ctx.orgId)));

  // Delete existing slides and recreate from snapshot
  await db.delete(slides).where(eq(slides.deckId, deckId));

  for (const slide of snapshot.slides) {
    await db.insert(slides).values({
      deckId,
      position: slide.position,
      type: slide.type,
      content: slide.content,
      notes: slide.notes ?? undefined,
      script: slide.script ?? undefined,
    });
  }

  return getDeckById(deckId, ctx);
}

async function getNextVersionNumber(deckId: string): Promise<number> {
  const [last] = await db
    .select({ version: deckVersions.version })
    .from(deckVersions)
    .where(eq(deckVersions.deckId, deckId))
    .orderBy(desc(deckVersions.version))
    .limit(1);
  return (last?.version ?? 0) + 1;
}

export async function reorderSlides(
  deckId: string,
  slideIds: string[],
  ctx: DeckServiceContext
): Promise<boolean> {
  return reorderSlidesRepo(deckId, slideIds, ctx);
}

export async function rotatePresentToken(
  id: string,
  ctx: DeckServiceContext
): Promise<string | null> {
  return rotatePresentTokenRepo(id, ctx);
}

export async function getDeckStats(ctx: DeckServiceContext): Promise<{
  total: number;
  draft: number;
  ready: number;
  archived: number;
}> {
  const all = await listDecksRepo(ctx, { limit: 10000 });
  return {
    total: all.total,
    draft: all.decks.filter((d) => d.status === "draft").length,
    ready: all.decks.filter((d) => d.status === "ready").length,
    archived: all.decks.filter((d) => d.status === "archived").length,
  };
}