"use client";

import * as React from "react";

interface StatementContent {
  eyebrow?: string;
  headline: string;
  highlight?: string;
  sub?: string;
}

export function StatementSlide({ content, theme }: { content: StatementContent; theme: Record<string, string> }) {
  const { eyebrow, headline, highlight, sub } = content;

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
        <p
          style={{
            fontSize: "14px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: theme["--slide-primary"],
            marginBottom: "16px",
          }}
        >
          {eyebrow}
        </p>
      )}
      <h1
        style={{
          fontSize: "64px",
          lineHeight: 1.15,
          fontWeight: 700,
          marginBottom: "16px",
          maxWidth: "1100px",
        }}
      >
        {highlight ? (
          <>
            {headline.replace(highlight, "")}
            <span style={{ color: theme["--slide-primary"] }}>{highlight}</span>
          </>
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