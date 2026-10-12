/**
 * Dotted paths into slide content (`painPoints.0.title`), used by inline editing on the
 * canvas to write one string back into the slide's JSON.
 */

/** Returns a copy of `content` with `value` at `path`; containers on the way are copied, not mutated. */
export function setContentPath(content: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> {
  const [head, ...rest] = path.split(".");
  if (!head) return content;
  if (rest.length === 0) return { ...content, [head]: value };

  const child = content[head];
  const [next] = rest;
  const childIsArray = /^\d+$/.test(next);

  if (childIsArray) {
    const list = Array.isArray(child) ? [...child] : [];
    const index = Number(next);
    if (rest.length === 1) {
      list[index] = value;
    } else {
      const item = list[index];
      list[index] = setContentPath(
        item && typeof item === "object" ? (item as Record<string, unknown>) : {},
        rest.slice(1).join("."),
        value
      );
    }
    return { ...content, [head]: list };
  }

  const nested = child && typeof child === "object" && !Array.isArray(child) ? (child as Record<string, unknown>) : {};
  return { ...content, [head]: setContentPath(nested, rest.join("."), value) };
}
