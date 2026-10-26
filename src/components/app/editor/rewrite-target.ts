import { getContentPath } from "@/lib/slides/content-path";
import type { FreeElement } from "@/lib/slides/free";
import { stringBounds } from "./field-schema";
import { schemaAt } from "./list-actions";
import type { EditorSlide } from "./validation";

/** A text on the canvas "Réécrire" can work on (Task 79). */
export interface RewriteTarget {
  /** Content path the text is written back to (\`painPoints.0.title\`, \`elements.3.text\`, \`elements.2.rows.1.0\`). */
  path: string;
  text: string;
  maxLength: number;
  /** A freeform text: written back as its rich text (formatting is not kept). */
  rich: boolean;
}

const FREE_TEXT = /^elements\.(\d+)\.text$/;
const TABLE_CELL = /^elements\.(\d+)\.rows\.\d+\.\d+$/;

/** The text at an editable path of the slide, with the length limit of where it goes back. */
export function rewriteTarget(slide: EditorSlide, path: string): RewriteTarget | null {
  const value = getContentPath(slide.content, path);
  if (typeof value !== "string" || !value.trim()) return null;

  if (slide.type === "free") {
    const index = Number((FREE_TEXT.exec(path) ?? TABLE_CELL.exec(path))?.[1]);
    const element = (slide.content.elements as FreeElement[] | undefined)?.[index];
    if (element?.kind === "text" && FREE_TEXT.test(path)) return { path, text: value, maxLength: 600, rich: true };
    if (element?.kind === "table") return { path, text: value, maxLength: 200, rich: false };
    return null;
  }
  const schema = schemaAt(slide.type, path);
  const max = schema ? stringBounds(schema).max : undefined;
  return { path, text: value, maxLength: Math.min(2000, max ?? 600), rich: false };
}
