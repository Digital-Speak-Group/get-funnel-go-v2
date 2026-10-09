"use client";

import * as React from "react";
import { headlineFill, kickerStyle } from "../style";

interface StatementContent {
  eyebrow?: string;
  headline: string;
  highlight?: string;
  sub?: string;
}

export function StatementSlide({ content, theme }: { content: StatementContent; theme: Record<string, string> }) {
  const { eyebrow, headline, highlight, sub } = content;
  const highlightAt = highlight ? headline.indexOf(highlight) : -1;

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
      {eyebrow && (
        <p style={{ ...kickerStyle(theme), marginBottom: "16px" }}>
          {eyebrow}
        </p>
      )}
      <h1
        style={{
          ...headlineFill(theme, theme["--slide-text"]),
          fontSize: "64px",
          lineHeight: 1.15,
          fontWeight: 700,
          marginBottom: "16px",
          maxWidth: "1100px",
        }}
      >
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
      {sub && (
        <p
          style={{
            fontSize: "22px",
            lineHeight: 1.4,
            fontWeight: 400,
            color: theme["--slide-muted"],
            maxWidth: "800px",
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}