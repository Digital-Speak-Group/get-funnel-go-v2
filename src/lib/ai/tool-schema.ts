import { z } from "zod";

const WRAP_KEY = "value";

export interface ToolSchema {
  parameters: Record<string, unknown>;
  /** Turns the model's tool arguments back into the shape the Zod schema expects. */
  unwrap: (args: unknown) => unknown;
}

/**
 * Converts a Zod schema into tool-call parameters. Tool parameters must be a
 * JSON object, so non-object schemas (e.g. the slide discriminated union) are
 * wrapped as `{ value: <schema> }` and unwrapped before validation.
 */
export function toToolSchema(schema: z.ZodType): ToolSchema {
  // `io: "input"` describes what the model must send (pre-transform/default).
  const json = z.toJSONSchema(schema, { io: "input", unrepresentable: "any" }) as Record<string, unknown>;
  delete json.$schema;

  if (json.type === "object") {
    return { parameters: json, unwrap: (args) => args };
  }

  return {
    parameters: { type: "object", properties: { [WRAP_KEY]: json }, required: [WRAP_KEY] },
    unwrap: (args) =>
      typeof args === "object" && args !== null && WRAP_KEY in args
        ? (args as Record<string, unknown>)[WRAP_KEY]
        : args,
  };
}
