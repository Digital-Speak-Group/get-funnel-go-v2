import "server-only";
import { db } from "@/lib/db/client";
import { assets, decks, slides } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { collectAssetIds } from "@/lib/slides/assets";

export interface AssetRepositoryContext {
  orgId: string;
  userId: string;
}

export interface AssetRecord {
  id: string;
  orgId: string;
  deckId: string | null;
  storagePath: string;
  mimeType: string;
}

export interface CreateAssetInput {
  id: string;
  deckId?: string;
  kind: "logo" | "image" | "export";
  storagePath: string;
  mimeType: string;
  width?: number;
  height?: number;
  sizeBytes: number;
}

const assetColumns = {
  id: assets.id,
  orgId: assets.orgId,
  deckId: assets.deckId,
  storagePath: assets.storagePath,
  mimeType: assets.mimeType,
};

export async function createAsset(input: CreateAssetInput, ctx: AssetRepositoryContext): Promise<AssetRecord> {
  const [row] = await db
    .insert(assets)
    .values({
      id: input.id,
      orgId: ctx.orgId,
      deckId: input.deckId ?? null,
      kind: input.kind,
      storagePath: input.storagePath,
      mimeType: input.mimeType,
      width: input.width === undefined ? null : String(input.width),
      height: input.height === undefined ? null : String(input.height),
      sizeBytes: String(input.sizeBytes),
    })
    .returning(assetColumns);
  return row;
}

/** An asset of the caller's org (editor, presenter, thumbnails). */
export async function getOrgAsset(id: string, ctx: AssetRepositoryContext): Promise<AssetRecord | null> {
  const [row] = await db
    .select(assetColumns)
    .from(assets)
    .where(and(eq(assets.id, id), eq(assets.orgId, ctx.orgId)));
  return row ?? null;
}

/**
 * An asset reachable through a present token: it must belong to the deck's org and be
 * referenced by one of the deck's slides. Anything else is treated as not found.
 */
export async function getAudienceAsset(presentToken: string, assetId: string): Promise<AssetRecord | null> {
  const [deck] = await db
    .select({ id: decks.id, orgId: decks.orgId })
    .from(decks)
    .where(and(eq(decks.presentToken, presentToken), isNull(decks.deletedAt)))
    .limit(1);
  if (!deck) return null;

  const contents = await db.select({ content: slides.content }).from(slides).where(eq(slides.deckId, deck.id));
  const referenced = new Set<string>();
  for (const { content } of contents) collectAssetIds(content, referenced);
  if (!referenced.has(assetId)) return null;

  const [row] = await db
    .select(assetColumns)
    .from(assets)
    .where(and(eq(assets.id, assetId), eq(assets.orgId, deck.orgId)));
  return row ?? null;
}
