import * as React from "react";
import type { RichParagraph, RichRun, RichText } from "@/lib/slides/rich-text";
import { isSafeHref } from "@/lib/slides/rich-text";

function Run({ run }: { run: RichRun }) {
  const style: React.CSSProperties = {
    fontWeight: run.bold ? 800 : undefined,
    fontStyle: run.italic ? "italic" : undefined,
    textDecoration: run.underline || run.link ? "underline" : undefined,
  };
  // Checked again at render: content is validated on save, but never trust a stored href.
  if (run.link && isSafeHref(run.link)) {
    return (
      <a href={run.link} target="_blank" rel="noopener noreferrer" style={{ ...style, color: "inherit" }}>
        {run.text}
      </a>
    );
  }
  return <span style={style}>{run.text}</span>;
}

const Line = ({ paragraph }: { paragraph: RichParagraph }) =>
  paragraph.runs.length > 0 ? paragraph.runs.map((run, i) => <Run key={i} run={run} />) : <br />;

/**
 * Read-only rendering of a freeform text's rich text (Task 76): paragraphs, and runs of list
 * paragraphs grouped into bullet or numbered lists. Inherits font, size and colour.
 */
export function RichTextView({ rich }: { rich: RichText }) {
  const blocks: React.ReactNode[] = [];
  for (let i = 0; i < rich.length; ) {
    const p = rich[i];
    if (!p.list) {
      blocks.push(
        <p key={i} style={{ margin: 0 }}>
          <Line paragraph={p} />
        </p>
      );
      i++;
      continue;
    }
    const kind = p.list;
    const items: RichParagraph[] = [];
    const start = i;
    while (i < rich.length && rich[i].list === kind) items.push(rich[i++]);
    const List = kind === "ordered" ? "ol" : "ul";
    blocks.push(
      <List key={start} style={{ margin: 0, paddingLeft: "1.2em", listStyleType: kind === "ordered" ? "decimal" : "disc" }}>
        {items.map((item, j) => (
          <li key={j}>
            <Line paragraph={item} />
          </li>
        ))}
      </List>
    );
  }
  return <>{blocks}</>;
}
