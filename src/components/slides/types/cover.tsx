"use client";

import * as React from "react";

interface CoverContent {
  kicker?: string;
  title: string;
  subtitle?: string;
  presenterName?: string;
}

export function CoverSlide({ content, theme }: { content: CoverContent; theme: Record<string, string> }) {
  const { kicker, title, subtitle, presenterName } = content;

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
      {kicker && (
        <p
          style={{
            fontSize: "14px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: theme["--slide-primary"],
            marginBottom: "24px",
          }}
        >
          {kicker}
        </p>
      )}
      <h1
        style={{
          fontSize: "72px",
          lineHeight: 1.05,
          fontWeight: 800,
          marginBottom: "24px",
          maxWidth: "1200px",
        }}
      >
        {title}
      </h1>
      {subtitle && (
        <p
          style={{
            fontSize: "24px",
            lineHeight: 1.35,
            fontWeight: 400,
            color: theme["--slide-muted"],
            maxWidth: "800px",
            marginBottom: "48px",
          }}
        >
          {subtitle}
        </p>
      )}
      {presenterName && (
        <p
          style={{
            fontSize: "18px",
            fontWeight: 400,
            color: theme["--slide-muted"],
          }}
        >
          Présenté par {presenterName}
        </p>
      )}
    </div>
  );
}