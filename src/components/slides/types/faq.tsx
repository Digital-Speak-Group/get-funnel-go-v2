"use client";

import * as React from "react";

interface FaqContent {
  headline: string;
  questions: Array<{
    q: string;
    a: string;
  }>;
}

export function FaqSlide({ content, theme }: { content: FaqContent; theme: Record<string, string> }) {
  const { headline, questions } = content;

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
      <header style={{ marginBottom: "48px", textAlign: "center" }}>
        <h1
          style={{
            fontSize: "48px",
            lineHeight: 1.15,
            fontWeight: 700,
            fontFamily: theme["--slide-font-display"],
            marginBottom: "16px",
            color: theme["--slide-primary"],
          }}
        >
          {headline}
        </h1>
      </header>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {questions.map((item, index) => (
          <details
            key={index}
            style={{
              background: theme["--slide-surface"],
              borderRadius: theme["--slide-radius"],
              border: `1px solid ${theme["--slide-muted"]}1a`,
              overflow: "hidden",
            }}
          >
            <summary
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 24px",
                fontSize: "18px",
                fontWeight: 600,
                fontFamily: theme["--slide-font-display"],
                cursor: "pointer",
                listStyle: "none",
              }}
            >
              {item.q}
              <span
                style={{
                  fontSize: "20px",
                  color: theme["--slide-primary"],
                  flexShrink: 0,
                  marginLeft: "16px",
                }}
              >
                +
              </span>
            </summary>
            <div
              style={{
                padding: "0 24px 24px 24px",
                fontSize: "16px",
                lineHeight: 1.6,
                color: theme["--slide-text"],
                borderTop: `1px solid ${theme["--slide-muted"]}1a`,
              }}
            >
              {item.a}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}