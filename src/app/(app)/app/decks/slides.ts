"use server";

import { getSession } from "@/lib/auth/session";
import { SLIDE_TYPES, SlideSchema } from "@/lib/slides/schema";
import { buildDefaultContent } from "@/lib/slides/defaults";
import {
  createSlide,
  deleteSlide,
  duplicateSlide,
  getSlideById,
  getSlidesByDeckId,
  reorderSlides,
  updateSlide,
} from "@/lib/db/repositories/slides";
import { z } from "zod";

const UpdateSlideSchema = z.object({
  slideId: z.string().uuid(),
  type: z.enum(SLIDE_TYPES),
  content: z.record(z.string(), z.unknown()),
  notes: z.string().max(2000),
  script: z.string().max(4000),
});

const AddSlideSchema = z.object({
  deckId: z.string().uuid(),
  type: z.enum(SLIDE_TYPES),
});

const ReorderSchema = z.object({
  deckId: z.string().uuid(),
  slideIds: z.array(z.string().uuid()).min(1).max(40),
});

export async function updateSlideAction(raw: unknown) {
  const session = await getSession();
  if (!session) return { error: "UNAUTHENTICATED" };

  const parsed = UpdateSlideSchema.safeParse(raw);
  if (!parsed.success) return { error: "INVALID_INPUT" };

  const ctx = { orgId: session.activeOrgId, userId: session.userId };
  const existing = await getSlideById(parsed.data.slideId, ctx);
  if (!existing) return { error: "NOT_FOUND" };

  const candidate = {
    id: existing.id,
    position: existing.position,
    type: parsed.data.type,
    content: parsed.data.content,
    notes: parsed.data.notes,
    script: parsed.data.script,
  };
  const valid = SlideSchema.safeParse(candidate);
  if (!valid.success) return { error: "INVALID_SLIDE" };

  const slide = await updateSlide(
    parsed.data.slideId,
    {
      type: valid.data.type,
      content: valid.data.content as Record<string, unknown>,
      notes: valid.data.notes,
      script: valid.data.script,
    },
    ctx
  );
  if (!slide) return { error: "NOT_FOUND" };

  return { slide };
}

export async function addSlideAction(raw: unknown) {
  const session = await getSession();
  if (!session) return { error: "UNAUTHENTICATED" };

  const parsed = AddSlideSchema.safeParse(raw);
  if (!parsed.success) return { error: "INVALID_INPUT" };

  const ctx = { orgId: session.activeOrgId, userId: session.userId };
  const content = buildDefaultContent(parsed.data.type);
  const valid = SlideSchema.safeParse({
    id: crypto.randomUUID(),
    position: 0,
    type: parsed.data.type,
    content,
    notes: "",
    script: "",
  });
  if (!valid.success) return { error: "INVALID_SLIDE" };

  const slide = await createSlide(
    { deckId: parsed.data.deckId, type: parsed.data.type, content },
    ctx
  );
  if (!slide) return { error: "NOT_FOUND" };

  return { slide };
}

export async function deleteSlideAction(slideId: string) {
  const session = await getSession();
  if (!session) return { error: "UNAUTHENTICATED" };

  const parsed = z.string().uuid().safeParse(slideId);
  if (!parsed.success) return { error: "INVALID_ID" };

  const ctx = { orgId: session.activeOrgId, userId: session.userId };
  const existing = await getSlideById(parsed.data, ctx);
  if (!existing) return { error: "NOT_FOUND" };

  const siblings = await getSlidesByDeckId(existing.deckId, ctx);
  if (siblings.length <= 1) return { error: "LAST_SLIDE" };

  const deleted = await deleteSlide(parsed.data, ctx);
  if (!deleted) return { error: "NOT_FOUND" };

  return { success: true };
}

export async function duplicateSlideAction(slideId: string) {
  const session = await getSession();
  if (!session) return { error: "UNAUTHENTICATED" };

  const parsed = z.string().uuid().safeParse(slideId);
  if (!parsed.success) return { error: "INVALID_ID" };

  const ctx = { orgId: session.activeOrgId, userId: session.userId };
  const slide = await duplicateSlide(parsed.data, ctx);
  if (!slide) return { error: "NOT_FOUND" };

  return { slide };
}

export async function reorderSlidesAction(raw: unknown) {
  const session = await getSession();
  if (!session) return { error: "UNAUTHENTICATED" };

  const parsed = ReorderSchema.safeParse(raw);
  if (!parsed.success) return { error: "INVALID_INPUT" };
  if (new Set(parsed.data.slideIds).size !== parsed.data.slideIds.length) {
    return { error: "INVALID_INPUT" };
  }

  const ctx = { orgId: session.activeOrgId, userId: session.userId };
  const ok = await reorderSlides(parsed.data.deckId, parsed.data.slideIds, ctx);
  if (!ok) return { error: "NOT_FOUND" };

  return { success: true };
}
