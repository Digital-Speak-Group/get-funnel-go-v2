import "server-only";
import { db } from "@/lib/db/client";
import { slides, decks } from "@/lib/db/schema";
import { eq, and, isNull, asc, desc, gte, lt, sql } from "drizzle-orm";
import type { ScriptCue } from "@/lib/slides/schema";

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
  cue?: ScriptCue;
  layout?: string;
  position?: number;
}

export interface UpdateSlideInput {
  type?: string;
  content?: Record<string, unknown>;
  notes?: string;
  script?: string;
  cue?: ScriptCue | null;
  layout?: string | null;
}

export interface SlideWithDeck {
  id: string;
  deckId: string;
  position: number;
  type: string;
  content: unknown;
  notes: string | null;
  script: string | null;
  cue: unknown;
  layout: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Moves every slide of the deck at `from` or later by `delta`. `slides_deck_position_unique`
 * is checked row by row (not deferred), so a plain `position + 1` can collide mid-statement:
 * park the rows on distinct negative positions first, then land them on their targets.
 */
async function shiftPositions(tx: Tx, deckId: string, from: number, delta: number) {
  await tx
    .update(slides)
    .set({ position: sql`-${slides.position} - 1` })
    .where(and(eq(slides.deckId, deckId), gte(slides.position, from)));
  await tx
    .update(slides)
    .set({ position: sql`-${slides.position} - 1 + ${delta}`, updatedAt: new Date() })
    .where(and(eq(slides.deckId, deckId), lt(slides.position, 0)));
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

  return db.transaction(async (tx) => {
    // Get max position to insert at the end if not specified
    let position = input.position;
    if (position === undefined) {
      const maxPosResult = await tx
        .select({ maxPos: slides.position })
        .from(slides)
        .where(eq(slides.deckId, input.deckId))
        .orderBy(desc(slides.position))
        .limit(1);
      position = ((maxPosResult[0]?.maxPos ?? -1) as number) + 1;
    } else {
      // Make room: every slide from this position on moves down one
      await shiftPositions(tx, input.deckId, position, 1);
    }

    const [slide] = await tx
      .insert(slides)
      .values({
        deckId: input.deckId,
        position,
        type: input.type,
        content: input.content,
        notes: input.notes ?? null,
        script: input.script ?? null,
        cue: input.cue ?? null,
        layout: input.layout ?? null,
      })
      .returning();

    return slide;
  });
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

  return db.transaction(async (tx) => {
    const result = await tx.delete(slides).where(eq(slides.id, id));
    if ((result.rowCount ?? 0) === 0) return false;

    // Close the gap: every slide after the deleted one moves up one
    await shiftPositions(tx, deckId, position + 1, -1);
    return true;
  });
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
      cue: (existing.cue as ScriptCue | null) ?? undefined,
      layout: existing.layout ?? undefined,
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

  return db.transaction(async (tx) => {
    // The new order must name every slide of the deck exactly once, or some would keep
    // a parked negative position below.
    const current = await tx.select({ id: slides.id }).from(slides).where(eq(slides.deckId, deckId));
    const ids = new Set(slideIds);
    if (ids.size !== slideIds.length || current.length !== ids.size || current.some((s) => !ids.has(s.id))) {
      return false;
    }

    // Park every slide on a distinct negative position so no target collides (see shiftPositions).
    await tx
      .update(slides)
      .set({ position: sql`-${slides.position} - 1` })
      .where(eq(slides.deckId, deckId));
    for (let i = 0; i < slideIds.length; i++) {
      await tx
        .update(slides)
        .set({ position: i, updatedAt: new Date() })
        .where(and(eq(slides.id, slideIds[i]), eq(slides.deckId, deckId)));
    }
    return true;
  });
}