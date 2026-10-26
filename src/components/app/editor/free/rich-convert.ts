import type { JSONContent } from "@tiptap/core";
import { isSafeHref, normalizeRuns, type RichParagraph, type RichRun, type RichText } from "@/lib/slides/rich-text";

/**
 * Conversion between the stored rich text (Task 76) and TipTap's document JSON. Anything the
 * stored format cannot hold (nested lists, unknown marks, unsafe links) is flattened or dropped.
 */

function marksOf(run: RichRun): JSONContent["marks"] {
  const marks: NonNullable<JSONContent["marks"]> = [];
  if (run.bold) marks.push({ type: "bold" });
  if (run.italic) marks.push({ type: "italic" });
  if (run.underline) marks.push({ type: "underline" });
  if (run.link) marks.push({ type: "link", attrs: { href: run.link } });
  return marks.length ? marks : undefined;
}

/** A run's text with line breaks as TipTap hard breaks. */
function inlineOf(run: RichRun): JSONContent[] {
  const out: JSONContent[] = [];
  run.text.split("\n").forEach((part, i) => {
    if (i > 0) out.push({ type: "hardBreak" });
    if (part) out.push({ type: "text", text: part, marks: marksOf(run) });
  });
  return out;
}

const paragraphOf = (p: RichParagraph): JSONContent => {
  const content = p.runs.flatMap(inlineOf);
  return content.length ? { type: "paragraph", content } : { type: "paragraph" };
};

export function richToTiptap(rich: RichText): JSONContent {
  const content: JSONContent[] = [];
  for (let i = 0; i < rich.length; ) {
    const p = rich[i];
    if (!p.list) {
      content.push(paragraphOf(p));
      i++;
      continue;
    }
    const kind = p.list;
    const items: JSONContent[] = [];
    while (i < rich.length && rich[i].list === kind) items.push({ type: "listItem", content: [paragraphOf(rich[i++])] });
    content.push({ type: kind === "ordered" ? "orderedList" : "bulletList", content: items });
  }
  return { type: "doc", content: content.length ? content : [{ type: "paragraph" }] };
}

function runsOf(node: JSONContent): RichRun[] {
  const runs: RichRun[] = [];
  for (const child of node.content ?? []) {
    if (child.type === "hardBreak") {
      runs.push({ text: "\n" });
      continue;
    }
    if (child.type !== "text" || !child.text) continue;
    const run: RichRun = { text: child.text };
    for (const mark of child.marks ?? []) {
      if (mark.type === "bold") run.bold = true;
      else if (mark.type === "italic") run.italic = true;
      else if (mark.type === "underline") run.underline = true;
      else if (mark.type === "link" && typeof mark.attrs?.href === "string" && isSafeHref(mark.attrs.href)) run.link = mark.attrs.href;
    }
    runs.push(run);
  }
  return normalizeRuns(runs);
}

/** Paragraphs of a block, lists flattened into list paragraphs of their own kind. */
function collect(node: JSONContent, list: RichParagraph["list"], out: RichParagraph[]) {
  switch (node.type) {
    case "paragraph":
      out.push(list ? { list, runs: runsOf(node) } : { runs: runsOf(node) });
      break;
    case "bulletList":
    case "orderedList":
      for (const item of node.content ?? []) collect(item, node.type === "orderedList" ? "ordered" : "bullet", out);
      break;
    default:
      for (const child of node.content ?? []) collect(child, list, out);
  }
}

export function tiptapToRich(doc: JSONContent): RichText {
  const out: RichParagraph[] = [];
  for (const node of doc.content ?? []) collect(node, undefined, out);
  return out;
}
