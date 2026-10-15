import { z } from "zod";

/**
 * Rich text of a freeform text element (Task 76): paragraphs (optionally bullet or numbered
 * list items) of runs with bold / italic / underline / link. Stored as this small validated
 * JSON, never as HTML, and rendered by React, so a deck can never carry markup or scripts.
 * The element's plain `text` stays in sync with it (search, conversion, accessibility).
 */

export const MAX_RICH_PARAGRAPHS = 60;
export const MAX_RICH_RUNS = 100;

/** Links open only http(s) and mailto addresses. */
export const isSafeHref = (href: string) => /^(https?:\/\/|mailto:)/i.test(href);

export const RichRunSchema = z.object({
  text: z.string().max(600),
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  underline: z.boolean().optional(),
  link: z.string().max(500).refine(isSafeHref, { message: "Lien http(s) ou mailto uniquement" }).optional(),
});

export const RichParagraphSchema = z.object({
  list: z.enum(["bullet", "ordered"]).optional(),
  runs: z.array(RichRunSchema).max(MAX_RICH_RUNS),
});

export const RichTextSchema = z.array(RichParagraphSchema).max(MAX_RICH_PARAGRAPHS);

export type RichRun = z.infer<typeof RichRunSchema>;
export type RichParagraph = z.infer<typeof RichParagraphSchema>;
export type RichText = z.infer<typeof RichTextSchema>;

/** Plain text of a rich text: paragraphs on their own lines. */
export function richToPlain(rich: RichText): string {
  return rich.map((p) => p.runs.map((r) => r.text).join("")).join("\n");
}

/** Rich text with one plain paragraph per line. */
export function plainToRich(text: string): RichText {
  return text.split("\n").map((line) => ({ runs: line ? [{ text: line }] : [] }));
}

/** Same formatting on both runs (so they can be one). */
const sameMarks = (a: RichRun, b: RichRun) =>
  !!a.bold === !!b.bold && !!a.italic === !!b.italic && !!a.underline === !!b.underline && a.link === b.link;

/** Joins neighbouring runs with the same formatting and drops empty ones. */
export function normalizeRuns(runs: RichRun[]): RichRun[] {
  const out: RichRun[] = [];
  for (const run of runs) {
    if (!run.text) continue;
    const last = out[out.length - 1];
    if (last && sameMarks(last, run)) out[out.length - 1] = { ...last, text: last.text + run.text };
    else out.push(run);
  }
  return out;
}

/** True when the rich text adds nothing to the plain text (no marks, no lists). */
export function isPlainRich(rich: RichText): boolean {
  return rich.every((p) => !p.list && p.runs.every((r) => !r.bold && !r.italic && !r.underline && !r.link));
}
