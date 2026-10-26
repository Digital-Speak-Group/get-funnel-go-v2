"use client";

import * as React from "react";
import { EditableText } from "../editable";
import { THEME_ROLE_VARS, type FreeTable, type ThemeRole } from "@/lib/slides/free";

const role = (r: ThemeRole) => `var(${THEME_ROLE_VARS[r]})`;
const line = `color-mix(in srgb, ${role("muted")} 35%, transparent)`;

/**
 * Table of a freeform slide (Task 78), in the theme's colours. Each cell is an EditableText
 * (\`elements.3.rows.1.2\`), so on the editor canvas cells are typed in directly.
 */
export function TableBody({ element, index }: { element: FreeTable; index: number }) {
  const accent = element.accent ?? "primary";
  const variant = element.variant ?? "lines";
  const headText = accent === "primary" ? "var(--slide-primary-fg)" : role("bg");

  return (
    <table
      style={{
        width: "100%",
        height: "100%",
        borderCollapse: "collapse",
        tableLayout: "fixed",
        fontSize: `${element.size ?? 24}px`,
        lineHeight: 1.3,
        fontFamily: "var(--slide-font-body)",
        color: role("text"),
      }}
    >
      <tbody>
        {element.rows.map((row, r) => {
          const head = !!element.header && r === 0;
          const bodyRow = element.header ? r - 1 : r;
          return (
            <tr
              key={r}
              style={{
                background: head
                  ? role(accent)
                  : variant === "striped" && bodyRow % 2 === 1
                    ? `color-mix(in srgb, ${role("surface")} 80%, transparent)`
                    : undefined,
              }}
            >
              {row.map((cell, c) => (
                <td
                  key={c}
                  style={{
                    padding: "0.45em 0.7em",
                    verticalAlign: "middle",
                    overflowWrap: "break-word",
                    fontWeight: head ? 700 : 400,
                    color: head ? headText : undefined,
                    border: variant === "grid" ? `2px solid ${line}` : undefined,
                    borderBottom: variant === "lines" && !head ? `2px solid ${line}` : undefined,
                  }}
                >
                  <EditableText as="span" path={`elements.${index}.rows.${r}.${c}`} value={cell} style={{ display: "block", minHeight: "1.3em" }} />
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
