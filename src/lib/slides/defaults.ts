import { z } from "zod";
import { slideContentSchemas, type SlideType } from "./schema";

const PLACEHOLDER = "…";

const KEY_OVERRIDES: Record<string, string> = {
  title: "Nouveau titre",
  headline: "Nouveau titre",
  body: "Décrivez votre message.",
  text: "Texte à compléter.",
};

function unwrap(schema: z.ZodType): z.ZodType {
  let current = schema;
  while (current instanceof z.ZodOptional || current instanceof z.ZodNullable) {
    current = current.unwrap() as z.ZodType;
  }
  return current;
}

export function buildDefaultValue(schema: z.ZodType, key = ""): unknown {
  if (schema.safeParse(undefined).success) return undefined;

  const core = unwrap(schema);

  if (core instanceof z.ZodString) return KEY_OVERRIDES[key] ?? PLACEHOLDER;
  if (core instanceof z.ZodBoolean) return false;
  if (core instanceof z.ZodNumber) return Math.max(0, core.minValue ?? 0);
  if (core instanceof z.ZodEnum) return core.options[0];
  if (core instanceof z.ZodLiteral) return core.value;

  if (core instanceof z.ZodArray) {
    const empty = core.safeParse([]);
    if (empty.success) return [];
    const issue = empty.error.issues.find((i) => i.code === "too_small");
    const min =
      issue && typeof issue.minimum === "number" ? issue.minimum : 1;
    return Array.from({ length: min }, () =>
      buildDefaultValue(core.element as z.ZodType, key)
    );
  }

  if (core instanceof z.ZodObject) {
    const out: Record<string, unknown> = {};
    for (const [k, field] of Object.entries(core.shape)) {
      const value = buildDefaultValue(field as z.ZodType, k);
      if (value !== undefined) out[k] = value;
    }
    return out;
  }

  return undefined;
}

/** A new freeform slide starts with a title and a text in the safe area, ready to move. */
function freeStarter(): Record<string, unknown> {
  return {
    elements: [
      { id: crypto.randomUUID(), kind: "text", style: "title", text: "Nouveau titre", x: 96, y: 96, w: 1200, h: 90 },
      { id: crypto.randomUUID(), kind: "text", style: "body", text: "Texte à compléter.", x: 96, y: 220, w: 900, h: 120 },
    ],
  };
}

export function buildDefaultContent(
  type: SlideType
): Record<string, unknown> {
  if (type === "free") return freeStarter();
  return buildDefaultValue(slideContentSchemas[type]) as Record<
    string,
    unknown
  >;
}
