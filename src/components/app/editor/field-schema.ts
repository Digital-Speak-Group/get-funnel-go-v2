import { z } from "zod";

export type FieldErrors = Record<string, string[]>;

export function isOptionalSchema(schema: z.ZodType): boolean {
  return schema.safeParse(undefined).success;
}

export function unwrapSchema(schema: z.ZodType): z.ZodType {
  let current = schema;
  while (current instanceof z.ZodOptional || current instanceof z.ZodNullable) {
    current = current.unwrap() as z.ZodType;
  }
  return current;
}

const boundsCache = new WeakMap<object, { max?: number; min?: number }>();

export function stringBounds(schema: z.ZodType): { max?: number; min?: number } {
  const core = unwrapSchema(schema);
  const cached = boundsCache.get(core);
  if (cached) return cached;

  const bounds: { max?: number; min?: number } = {};
  if (core instanceof z.ZodString) {
    if (!isOptionalSchema(schema)) {
      const empty = core.safeParse("");
      if (!empty.success) {
        const issue = empty.error.issues.find((i) => i.code === "too_small");
        if (issue && typeof issue.minimum === "number") {
          bounds.min = issue.minimum;
        }
      }
    }
    const long = core.safeParse("a".repeat(10000));
    if (!long.success) {
      const issue = long.error.issues.find((i) => i.code === "too_big");
      if (issue && typeof issue.maximum === "number") {
        bounds.max = issue.maximum;
      }
    }
  }

  boundsCache.set(core, bounds);
  return bounds;
}

export function setAtPath(
  source: Record<string, unknown>,
  path: string,
  value: unknown
): Record<string, unknown> {
  if (!path) return value as Record<string, unknown>;
  const [head, ...rest] = path.split(".");
  return {
    ...source,
    [head]: rest.length
      ? setAtPath(
          (source[head] ?? {}) as Record<string, unknown>,
          rest.join("."),
          value
        )
      : value,
  };
}

export function normalizeContent(
  schema: z.ZodType,
  value: unknown
): unknown {
  if (value === "" || value === null || value === undefined) {
    return isOptionalSchema(schema) ? undefined : value;
  }

  const core = unwrapSchema(schema);

  if (core instanceof z.ZodObject && typeof value === "object" && !Array.isArray(value)) {
    const source = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [key, field] of Object.entries(core.shape)) {
      if (!(key in source)) continue;
      const normalized = normalizeContent(field as z.ZodType, source[key]);
      if (normalized !== undefined) out[key] = normalized;
    }
    return out;
  }

  if (core instanceof z.ZodArray && Array.isArray(value)) {
    return value.map((item) =>
      normalizeContent(core.element as z.ZodType, item)
    );
  }

  return value;
}

function describeIssue(issue: z.ZodIssue): string {
  if (issue.code === "too_small" && typeof issue.minimum === "number") {
    return issue.origin === "array"
      ? `Ajoutez au moins ${issue.minimum} élément${issue.minimum > 1 ? "s" : ""}.`
      : `Minimum ${issue.minimum} caractère${issue.minimum > 1 ? "s" : ""}.`;
  }
  if (issue.code === "too_big" && typeof issue.maximum === "number") {
    return issue.origin === "array"
      ? `Maximum ${issue.maximum} élément${issue.maximum > 1 ? "s" : ""}.`
      : `Maximum ${issue.maximum} caractères.`;
  }
  if (issue.code === "invalid_type") return "Ce champ est requis.";
  return issue.message;
}

export function groupIssues(issues: z.ZodIssue[]): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join(".");
    if (!out[key]) out[key] = [];
    out[key].push(describeIssue(issue));
  }
  return out;
}
