import { getSession } from "@/lib/auth/session";
import { readOrgAsset } from "@/server/services/assets";
import { assetResponse, isUuid, notFoundResponse } from "@/server/services/asset-response";

/** GET /api/assets/[assetId] — an image of the caller's active org (editor, presenter, thumbnails). */
export async function GET(_req: Request, { params }: { params: Promise<{ assetId: string }> }) {
  const { assetId } = await params;
  if (!isUuid(assetId)) return notFoundResponse();

  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const object = await readOrgAsset(assetId, { orgId: session.activeOrgId, userId: session.userId });
  if (!object) return notFoundResponse();
  // Asset ids are never reused and their bytes never change, so a long private cache is safe.
  return assetResponse(object, 60 * 60 * 24 * 30);
}
