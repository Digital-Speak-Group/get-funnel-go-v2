import { z } from "zod";

/** Longest value a presenter can type into a blank; also enforced on receipt. */
export const BLANK_VALUE_MAX = 40;

const BlanksPayloadSchema = z.object({
  slideId: z.string().min(1).max(64),
  values: z.array(z.string().max(BLANK_VALUE_MAX)).max(6),
});

/** A received `blanks` payload, or null when it is missing or malformed (never trusted as-is). */
export function parseBlanksPayload(raw: unknown): { slideId: string; values: string[] } | null {
  const parsed = BlanksPayloadSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
