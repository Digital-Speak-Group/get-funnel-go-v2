import { readAudienceAsset } from "@/server/services/assets";
import { assetResponse, isUuid, notFoundResponse } from "@/server/services/asset-response";

/**
 * GET /p/[token]/assets/[assetId] — an image for the public audience view and PDF export.
 * No session: the present token is the credential, and only assets the token's deck
 * references are served (other org assets 404). Short cache so a rotated token or an
 * image removed from the deck stops being served soon.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string; assetId: string }> }) {
  const { token, assetId } = await params;
  if (!isUuid(assetId) || token.length < 16 || token.length > 64) return notFoundResponse();

  const object = await readAudienceAsset(token, assetId);
  if (!object) return notFoundResponse();
  return assetResponse(object, 60 * 10);
}
