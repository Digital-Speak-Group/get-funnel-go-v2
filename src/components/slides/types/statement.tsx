"use client";

import * as React from "react";
import { headlineFill, kickerStyle } from "../style";
import { EditableText, useSlideEditing } from "../editable";

interface StatementContent {
  eyebrow?: string;
  headline: string;
  highlight?: string;
  sub?: string;
}

export function StatementSlide({ content, theme }: { content: StatementContent; theme: Record<string, string> }) {
  const { eyebrow, headline, highlight, sub } = content;
  const editing = useSlideEditing();
  const highlightAt = highlight ? headline.indexOf(highlight) : -1;
  const headlineStyle: React.CSSProperties = {
    ...headlineFill(theme, theme["--slide-text"]),
    fontSize: "64px",
    lineHeight: 1.15,
    fontWeight: 700,
    marginBottom: "16px",
    maxWidth: "1100px",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
        padding: "96px",
        textAlign: "center",
        fontFamily: theme["--slide-font-display"],
        color: theme["--slide-text"],
      }}
    >
      <EditableText as="p" path="eyebrow" value={eyebrow} style={{ ...kickerStyle(theme), marginBottom: "16px" }} />
      {/* The highlight is a span inside the headline: while editing, the headline is one plain field. */}
      {editing ? (
        <EditableText as="h1" path="headline" value={headline} style={headlineStyle} />
      ) : (
        <h1 style={headlineStyle}>
          {highlight ? (
            highlightAt >= 0 ? (
              <>
                {headline.slice(0, highlightAt)}
                <span style={{ color: theme["--slide-primary-text"] }}>{highlight}</span>
                {headline.slice(highlightAt + highlight.length)}
              </>
            ) : (
              // Highlight written as a separate phrase: keep it on its own, after a space.
              <>
                {headline}{" "}
                <span style={{ color: theme["--slide-primary-text"] }}>{highlight}</span>
              </>
            )
          ) : (
            headline
          )}
        </h1>
      )}
      <EditableText
        as="p"
        path="sub"
        value={sub}
        multiline
        style={{
          fontSize: "22px",
          lineHeight: 1.4,
          fontWeight: 400,
          color: theme["--slide-muted"],
          maxWidth: "800px",
        }}
      />
    </div>
  );
}
