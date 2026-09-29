"use client";

import * as React from "react";

interface MistakesContent {
  headline: string;
  mistakes: Array<{
    mistake: string;
    fix: string;
  }>;
}

export function MistakesSlide({ content, theme }: { content: MistakesContent; theme: Record<string, string> }) {
  const { headline, mistakes } = content;

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
            color: theme["--slide-danger"],
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
          gap: "24px",
        }}
      >
        {mistakes.map((m, index) => (
          <div
            key={index}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "24px",
              padding: "28px",
              background: theme["--slide-surface"],
              borderRadius: theme["--slide-radius"],
              border: `1px solid ${theme["--slide-danger"]}26`,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                padding: "20px",
                background: `${theme["--slide-danger"]}10`,
                borderRadius: theme["--slide-radius"],
                border: `1px solid ${theme["--slide-danger"]}33`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span
                  style={{
                    fontSize: "22px",
                    width: "40px",
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: theme["--slide-danger"],
                    color: theme["--slide-primary-fg"],
                    borderRadius: "10px",
                    flexShrink: 0,
                  }}
                >
                  ✕
                </span>
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    fontFamily: theme["--slide-font-display"],
                    color: theme["--slide-danger"],
                  }}
                >
                  ERREUR
                </span>
              </div>
              <p style={{ fontSize: "16px", lineHeight: 1.55, margin: 0 }}>{m.mistake}</p>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                padding: "20px",
                background: `${theme["--slide-success"]}10`,
                borderRadius: theme["--slide-radius"],
                border: `1px solid ${theme["--slide-success"]}33`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span
                  style={{
                    fontSize: "22px",
                    width: "40px",
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: theme["--slide-success"],
                    color: theme["--slide-primary-fg"],
                    borderRadius: "10px",
                    flexShrink: 0,
                  }}
                >
                  ✓
                </span>
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    fontFamily: theme["--slide-font-display"],
                    color: theme["--slide-success"],
                  }}
                >
                  CORRECTION
                </span>
              </div>
              <p style={{ fontSize: "16px", lineHeight: 1.55, margin: 0 }}>{m.fix}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}