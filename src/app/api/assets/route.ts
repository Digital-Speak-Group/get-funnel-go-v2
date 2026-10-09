import { getSession } from "@/lib/auth/session";
import { getRateLimitHeaders, rateLimit } from "@/lib/rate-limit";
import { uploadImage } from "@/server/services/assets";
import { isUuid } from "@/server/services/asset-response";

const uploadLimiter = rateLimit({ interval: 60_000, limit: 30 });

const STATUS: Record<string, number> = { EMPTY: 400, TOO_LARGE: 413, UNSUPPORTED_TYPE: 415, DECK_NOT_FOUND: 404 };

/**
 * POST /api/assets — multipart form: `file` (PNG/JPEG/WebP/GIF, ≤ 4 MB), optional `deckId`.
 * Stores the image for the caller's active org and returns `{ assetId }`.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const limited = await uploadLimiter.check(session.userId);
  if (!limited.success) {
    return Response.json({ error: "RATE_LIMITED" }, { status: 429, headers: getRateLimitHeaders(limited) });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "EMPTY" }, { status: 400 });
  const deckId = form?.get("deckId");
  if (deckId !== null && deckId !== undefined && (typeof deckId !== "string" || !isUuid(deckId))) {
    return Response.json({ error: "DECK_NOT_FOUND" }, { status: 404 });
  }

  const result = await uploadImage(new Uint8Array(await file.arrayBuffer()), {
    orgId: session.activeOrgId,
    userId: session.userId,
  }, { deckId: deckId ?? undefined });

  if (!result.ok) return Response.json({ error: result.error }, { status: STATUS[result.error] ?? 400 });
  return Response.json({ assetId: result.assetId }, { status: 201 });
}
