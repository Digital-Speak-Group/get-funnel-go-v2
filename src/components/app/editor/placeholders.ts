/**
 * Bracketed placeholders ("[Votre nom]", "[X €]") left in a slide's visible content.
 * Templates and AI output use them for facts only the user can supply; the editor flags
 * slides that still contain any. Derived from content, so nothing extra is stored.
 */
const PLACEHOLDER = /\[[^[\]\n]{1,80}\]/g;

export function findPlaceholders(value: unknown): string[] {
  const found = new Set<string>();
  const visit = (v: unknown) => {
    if (typeof v === "string") {
      for (const match of v.match(PLACEHOLDER) ?? []) found.add(match);
    } else if (Array.isArray(v)) {
      v.forEach(visit);
    } else if (v && typeof v === "object") {
      Object.values(v).forEach(visit);
    }
  };
  visit(value);
  return [...found];
}
