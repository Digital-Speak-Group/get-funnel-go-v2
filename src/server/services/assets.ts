import "server-only";
import { randomUUID } from "node:crypto";
import { logger } from "@/lib/logger";
import { getDeckById } from "@/lib/db/repositories/decks";
import {
  createAsset,
  getAudienceAsset,
  getOrgAsset,
  type AssetRecord,
} from "@/lib/db/repositories/assets";
import { getStorageProvider } from "@/lib/storage/supabase";
import { MAX_IMAGE_BYTES, sniffImage } from "@/lib/storage/image";
import type { StorageProvider, StoredObject } from "@/lib/storage/types";

export interface AssetServiceContext {
  orgId: string;
  userId: string;
}

export type UploadResult =
  | { ok: true; assetId: string }
  | { ok: false; error: "EMPTY" | "TOO_LARGE" | "UNSUPPORTED_TYPE" | "DECK_NOT_FOUND" };

/** Storage key layout: one folder per org, file named by asset id. */
export function assetStorageKey(orgId: string, assetId: string, ext: string): string {
  return `orgs/${orgId}/${assetId}.${ext}`;
}

/**
 * Stores an uploaded image for the caller's org. The type comes from the bytes (PNG, JPEG,
 * WebP, GIF), never from the client; SVG is refused because it can carry scripts.
 */
export async function uploadImage(
  bytes: Uint8Array,
  ctx: AssetServiceContext,
  options: { deckId?: string; kind?: "logo" | "image" } = {},
  storage: StorageProvider = getStorageProvider()
): Promise<UploadResult> {
  if (bytes.byteLength === 0) return { ok: false, error: "EMPTY" };
  if (bytes.byteLength > MAX_IMAGE_BYTES) return { ok: false, error: "TOO_LARGE" };
  const info = sniffImage(bytes);
  if (!info) return { ok: false, error: "UNSUPPORTED_TYPE" };

  if (options.deckId && !(await getDeckById(options.deckId, ctx))) {
    return { ok: false, error: "DECK_NOT_FOUND" };
  }

  const id = randomUUID();
  const storagePath = assetStorageKey(ctx.orgId, id, info.ext);
  await storage.put(storagePath, bytes, info.mimeType);
  await createAsset(
    {
      id,
      deckId: options.deckId,
      kind: options.kind ?? "image",
      storagePath,
      mimeType: info.mimeType,
      width: info.width,
      height: info.height,
      sizeBytes: bytes.byteLength,
    },
    ctx
  );
  logger.info("Asset uploaded", { orgId: ctx.orgId, assetId: id, bytes: bytes.byteLength });
  return { ok: true, assetId: id };
}

async function load(asset: AssetRecord | null, storage: StorageProvider): Promise<StoredObject | null> {
  if (!asset) return null;
  const object = await storage.get(asset.storagePath);
  if (!object) {
    logger.warn("Asset row without stored object", { assetId: asset.id });
    return null;
  }
  // The type recorded at upload wins over whatever the store reports.
  return { body: object.body, contentType: asset.mimeType };
}

/** For the app (editor, presenter): the asset must belong to the caller's active org. */
export async function readOrgAsset(
  assetId: string,
  ctx: AssetServiceContext,
  storage: StorageProvider = getStorageProvider()
): Promise<StoredObject | null> {
  return load(await getOrgAsset(assetId, ctx), storage);
}

/** For the audience view and PDF export: only assets the token's deck references. */
export async function readAudienceAsset(
  presentToken: string,
  assetId: string,
  storage: StorageProvider = getStorageProvider()
): Promise<StoredObject | null> {
  return load(await getAudienceAsset(presentToken, assetId), storage);
}
