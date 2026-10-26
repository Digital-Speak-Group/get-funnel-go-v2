/**
 * Asset ids a slide's content points at (any `assetId` key, at any depth). The audience route
 * serves only assets the deck itself references, so a present token never exposes the rest of
 * the org's library.
 */
export function collectAssetIds(content: unknown, into: Set<string> = new Set()): Set<string> {
  if (Array.isArray(content)) {
    for (const item of content) collectAssetIds(item, into);
  } else if (content && typeof content === "object") {
    for (const [key, value] of Object.entries(content)) {
      if (key === "assetId" && typeof value === "string") into.add(value);
      else collectAssetIds(value, into);
    }
  }
  return into;
}
