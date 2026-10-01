"use server";

import { getSession } from "@/lib/auth/session";
import {
  listDecks,
  updateDeck as updateDeckRepo,
  softDeleteDeck,
  createDeck as createDeckRepo,
  createDeckFromTemplate,
  duplicateDeck,
} from "@/server/services/decks";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CreateDeckSchema = z.object({
  title: z.string().min(1).max(120),
  themeId: z.string().uuid(),
  templateId: z.string().uuid().optional(),
  language: z.string().length(2).default("fr"),
});

const UpdateDeckSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(120).optional(),
  status: z.enum(["draft", "ready", "archived"]).optional(),
  themeId: z.string().uuid().optional(),
});

const ListDecksSchema = z.object({
  search: z.string().max(100).optional(),
  sort: z.enum(["updated_desc", "updated_asc", "title_asc", "title_desc"]).optional(),
});

const DeckIdSchema = z.string().uuid();

export async function listDecksAction(raw?: unknown) {
  const session = await getSession();
  if (!session) return { error: "UNAUTHENTICATED" };

  const parsed = ListDecksSchema.safeParse(raw ?? {});
  if (!parsed.success) return { error: "INVALID_INPUT" };

  const result = await listDecks(
    { orgId: session.activeOrgId, userId: session.userId },
    { search: parsed.data.search, sort: parsed.data.sort }
  );
  return { decks: result.decks, total: result.total };
}

export async function createDeckAction(raw: unknown) {
  const session = await getSession();
  if (!session) return { error: "UNAUTHENTICATED" };

  const parsed = CreateDeckSchema.safeParse(raw);
  if (!parsed.success) return { error: "INVALID_INPUT" };

  const ctx = { orgId: session.activeOrgId, userId: session.userId };
  let deck;

  try {
    if (parsed.data.templateId) {
      deck = await createDeckFromTemplate({
        title: parsed.data.title,
        templateId: parsed.data.templateId,
        themeId: parsed.data.themeId,
        language: parsed.data.language,
      }, ctx);
    } else {
      deck = await createDeckRepo(parsed.data, ctx);
    }
  } catch (err) {
    console.error("Create deck failed:", err);
    return { error: "INTERNAL_ERROR" };
  }

  revalidatePath("/app");
  return { deck };
}

export async function updateDeckAction(raw: unknown) {
  const session = await getSession();
  if (!session) return { error: "UNAUTHENTICATED" };

  const parsed = UpdateDeckSchema.safeParse(raw);
  if (!parsed.success) return { error: "INVALID_INPUT" };

  const { id, ...data } = parsed.data;
  const deck = await updateDeckRepo(id, data, { orgId: session.activeOrgId, userId: session.userId });

  if (!deck) return { error: "NOT_FOUND" };

  revalidatePath("/app");
  return { deck };
}

export async function deleteDeckAction(deckId: string) {
  const session = await getSession();
  if (!session) return { error: "UNAUTHENTICATED" };

  const parsed = DeckIdSchema.safeParse(deckId);
  if (!parsed.success) return { error: "INVALID_ID" };

  const deleted = await softDeleteDeck(deckId, { orgId: session.activeOrgId, userId: session.userId });
  if (!deleted) return { error: "NOT_FOUND" };

  revalidatePath("/app");
  return { success: true };
}

export async function duplicateDeckAction(deckId: string) {
  const session = await getSession();
  if (!session) return { error: "UNAUTHENTICATED" };

  const parsed = DeckIdSchema.safeParse(deckId);
  if (!parsed.success) return { error: "INVALID_ID" };

  const deck = await duplicateDeck(deckId, { orgId: session.activeOrgId, userId: session.userId });
  if (!deck) return { error: "NOT_FOUND" };

  revalidatePath("/app");
  return { deck };
}
