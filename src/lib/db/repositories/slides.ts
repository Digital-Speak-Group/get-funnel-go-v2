import "server-only";
import { db } from "@/lib/db/client";
import { slides, decks } from "@/lib/db/schema";
import { eq, and, isNull, asc, desc, sql } from "drizzle-orm";

export interface SlideRepositoryContext {
  orgId: string;
  userId: string;
}

export interface CreateSlideInput {
  deckId: string;
  type: string;
  content: Record<string, unknown>;
  notes?: string;
  script?: string;
  position?: number;
}

export interface UpdateSlideInput {
  type?: string;
  content?: Record<string, unknown>;
  notes?: string;
  script?: string;
}

export interface SlideWithDeck {
  id: string;
  deckId: string;
  position: number;
  type: string;
  content: unknown;
  notes: string | null;
  script: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function createSlide(
  input: CreateSlideInput,
  ctx: SlideRepositoryContext
): Promise<SlideWithDeck | null> {
  // Verify deck exists and user has access
  const [deck] = await db
    .select({ id: decks.id, orgId: decks.orgId })
    .from(decks)
    .where(and(eq(decks.id, input.deckId), eq(decks.orgId, ctx.orgId), isNull(decks.deletedAt)));

  if (!deck) return null;

  // Get max position to insert at the end if not specified
  let position = input.position;
  if (position === undefined) {
    const maxPosResult = await db
      .select({ maxPos: slides.position })
      .from(slides)
      .where(eq(slides.deckId, input.deckId))
      .orderBy(desc(slides.position))
      .limit(1);
    position = ((maxPosResult[0]?.maxPos ?? -1) as number) + 1;
  }

  // Shift slides after this position
  await db
    .update(slides)
    .set({ position: sql`${slides.position} + 1`, updatedAt: new Date() })
    .where(and(eq(slides.deckId, input.deckId), eq(slides.position, position)));

  const [slide] = await db
    .insert(slides)
    .values({
      deckId: input.deckId,
      position,
      type: input.type,
      content: input.content,
      notes: input.notes ?? null,
      script: input.script ?? null,
    })
    .returning();

  return slide;
}

export async function getSlideById(
  id: string,
  ctx: SlideRepositoryContext
): Promise<SlideWithDeck | null> {
  const [slide] = await db
    .select()
    .from(slides)
    .innerJoin(decks, eq(slides.deckId, decks.id))
    .where(and(eq(slides.id, id), eq(decks.orgId, ctx.orgId), isNull(decks.deletedAt)));

  return slide?.slides ?? null;
}

export async function getSlidesByDeckId(
  deckId: string,
  ctx: SlideRepositoryContext
): Promise<SlideWithDeck[]> {
  // Verify deck ownership
  const [deck] = await db
    .select({ id: decks.id })
    .from(decks)
    .where(and(eq(decks.id, deckId), eq(decks.orgId, ctx.orgId), isNull(decks.deletedAt)));

  if (!deck) return [];

  return db
    .select()
    .from(slides)
    .where(eq(slides.deckId, deckId))
    .orderBy(asc(slides.position));
}

export async function updateSlide(
  id: string,
  input: UpdateSlideInput,
  ctx: SlideRepositoryContext
): Promise<SlideWithDeck | null> {
  // Verify slide exists and user has access via deck
  const existing = await getSlideById(id, ctx);
  if (!existing) return null;

  const [slide] = await db
    .update(slides)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(slides.id, id))
    .returning();

  return slide;
}

export async function deleteSlide(
  id: string,
  ctx: SlideRepositoryContext
): Promise<boolean> {
  const existing = await getSlideById(id, ctx);
  if (!existing) return false;

  const deckId = existing.deckId;
  const position = existing.position;

  const result = await db.delete(slides).where(eq(slides.id, id));

  if ((result.rowCount ?? 0) > 0) {
    // Shift remaining slides down
    await db
      .update(slides)
      .set({ position: sql`${slides.position} - 1`, updatedAt: new Date() })
      .where(and(eq(slides.deckId, deckId), eq(slides.position, position)));
    return true;
  }

  return false;
}

export async function duplicateSlide(
  id: string,
  ctx: SlideRepositoryContext
): Promise<SlideWithDeck | null> {
  const existing = await getSlideById(id, ctx);
  if (!existing) return null;

  return createSlide(
    {
      deckId: existing.deckId,
      type: existing.type,
      content: existing.content as Record<string, unknown>,
      notes: existing.notes ?? undefined,
      script: existing.script ?? undefined,
      position: existing.position + 1,
    },
    ctx
  );
}

export async function reorderSlides(
  deckId: string,
  slideIds: string[],
  ctx: SlideRepositoryContext
): Promise<boolean> {
  // Verify deck ownership
  const [deck] = await db
    .select({ id: decks.id })
    .from(decks)
    .where(and(eq(decks.id, deckId), eq(decks.orgId, ctx.orgId), isNull(decks.deletedAt)));

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