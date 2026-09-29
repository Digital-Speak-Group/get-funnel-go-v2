"use client";

import * as React from "react";

interface AuthorityContent {
  headline: string;
  points: Array<{
    icon?: string;
    title: string;
    text: string;
  }>;
}

export function AuthoritySlide({ content, theme }: { content: AuthorityContent; theme: Record<string, string> }) {
  const { headline, points } = content;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: "96px",
        fontFamily: theme["--slide-font-body"],
        color: theme["--slide-text"],
      }}
    >
      <header style={{ marginBottom: "64px", textAlign: "center" }}>
        <h1
          style={{
            fontSize: "48px",
            lineHeight: 1.15,
            fontWeight: 700,
            fontFamily: theme["--slide-font-display"],
            marginBottom: "16px",
          }}
        >
          {headline}
        </h1>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "32px",
          flex: 1,
        }}
      >
        {points.map((point, index) => (
<div
              key={index}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                padding: "24px",
                background: theme["--slide-surface"],
                borderRadius: theme["--slide-radius"],
                border: `1px solid ${theme["--slide-muted"]}33`,
              }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {point.icon && (
                <span
                  style={{
                    fontSize: "24px",
                    width: "48px",
                    height: "48px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: theme["--slide-primary"],
                    color: theme["--slide-primary-fg"],
                    borderRadius: "12px",
                  }}
                >
                  {point.icon}
                </span>
              )}
              <h3
                style={{
                  fontSize: "22px",
                  fontWeight: 600,
                  fontFamily: theme["--slide-font-display"],
                  margin: 0,
                }}
              >
                {point.title}
              </h3>
            </div>
            <p
              style={{
                fontSize: "16px",
                lineHeight: 1.55,
                color: theme["--slide-muted"],
                margin: 0,
              }}
            >
              {point.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}