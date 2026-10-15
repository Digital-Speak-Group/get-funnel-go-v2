import { z } from "zod";
import { slideContentSchemas, type SlideType } from "@/lib/slides/schema";
import { buildDefaultValue } from "@/lib/slides/defaults";
import { setContentPath } from "@/lib/slides/content-path";
import { unwrapSchema } from "./field-schema";

/**
 * Item actions on the canvas (move, duplicate, delete) for the repeated parts of a slide:
 * pain points, steps, plans… A list is addressed by its content path (`painPoints`,
 * `layers.1.items`), its limits come from the slide type's schema.
 */

export type ListAction = "before" | "after" | "duplicate" | "remove";

export interface ListBounds {
  min: number;
  max: number;
}

function arraySchemaAt(type: SlideType, path: string): z.ZodArray | null {
  const node = schemaAt(type, path);
  const core = node && unwrapSchema(node);
  return core instanceof z.ZodArray ? core : null;
}

/** The schema at `path` in a slide type's content (numeric segments step into items). */
export function schemaAt(type: SlideType, path: string): z.ZodType | null {
  let node: z.ZodType | undefined = slideContentSchemas[type] as unknown as z.ZodType;
  for (const segment of path.split(".")) {
    const core: z.ZodType = unwrapSchema(node!);
    if (/^\d+$/.test(segment)) {
      if (!(core instanceof z.ZodArray)) return null;
      node = core.element as z.ZodType;
    } else {
      if (!(core instanceof z.ZodObject)) return null;
      node = (core.shape as Record<string, z.ZodType>)[segment];
      if (!node) return null;
    }
  }
  return node ?? null;
}

const boundsCache = new Map<string, ListBounds>();

/** Zod 4 keeps array limits inside its checks: probe them with valid items, like `stringBounds`. */
export function listBounds(type: SlideType, path: string): ListBounds {
  const key = `${type}:${path.replace(/\.\d+(?=\.|$)/g, ".#")}`;
  const cached = boundsCache.get(key);
  if (cached) return cached;

  const bounds: ListBounds = { min: 0, max: Infinity };
  const schema = arraySchemaAt(type, path);
  if (schema) {
    const item = buildDefaultValue(schema.element as z.ZodType);
    const tooSmall = schema.safeParse([]);
    if (!tooSmall.success) {
      const issue = tooSmall.error.issues.find((i) => i.code === "too_small");
      if (issue && "minimum" in issue) bounds.min = Number(issue.minimum);
    }
    const tooBig = schema.safeParse(Array.from({ length: 200 }, () => item));
    if (!tooBig.success) {
      const issue = tooBig.error.issues.find((i) => i.code === "too_big");
      if (issue && "maximum" in issue) bounds.max = Number(issue.maximum);
    }
  }
  boundsCache.set(key, bounds);
  return bounds;
}

function getList(content: Record<string, unknown>, path: string): unknown[] {
  const value = path.split(".").reduce<unknown>(
    (node, key) => (node && typeof node === "object" ? (node as Record<string, unknown>)[key] : undefined),
    content
  );
  return Array.isArray(value) ? value : [];
}

/** Whether `action` on item `index` keeps the list valid. */
export function canApply(action: ListAction, index: number, length: number, bounds: ListBounds): boolean {
  switch (action) {
    case "before":
      return index > 0;
    case "after":
      return index < length - 1;
    case "duplicate":
      return length < bounds.max;
    case "remove":
      return length > bounds.min;
  }
}

/** New content with the action applied, or null when it would break the list's limits. */
export function applyListAction(
  type: SlideType,
  content: Record<string, unknown>,
  path: string,
  action: ListAction,
  index: number
): Record<string, unknown> | null {
  const list = getList(content, path);
  if (index < 0 || index >= list.length) return null;
  if (!canApply(action, index, list.length, listBounds(type, path))) return null;

  const next = [...list];
  switch (action) {
    case "before":
    case "after": {
      const target = action === "before" ? index - 1 : index + 1;
      [next[index], next[target]] = [next[target], next[index]];
      break;
    }
    case "duplicate":
      next.splice(index + 1, 0, structuredClone(list[index]));
      break;
    case "remove":
      next.splice(index, 1);
      break;
  }
  return setContentPath(content, path, next);
}
