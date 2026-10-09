import "server-only";
import type { StoredObject } from "@/lib/storage/types";

/**
 * HTTP response for a stored image. `nosniff` + a deny-all CSP keep a mislabelled file from
 * ever running as a document; caching stays private because access depends on the caller.
 */
export function assetResponse(object: StoredObject, maxAgeSec: number): Response {
  return new Response(Buffer.from(object.body), {
    headers: {
      "Content-Type": object.contentType,
      "Content-Length": String(object.body.byteLength),
      "Cache-Control": `private, max-age=${maxAgeSec}`,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}

export const notFoundResponse = () => new Response("Not found", { status: 404 });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (value: string) => UUID.test(value);
