"use client";

import * as React from "react";

interface ProblemContent {
  headline: string;
  intro?: string;
  painPoints: Array<{
    icon?: string;
    title: string;
    text: string;
  }>;
}

export function ProblemSlide({ content, theme }: { content: ProblemContent; theme: Record<string, string> }) {
  const { headline, intro, painPoints } = content;

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
        {intro && (
          <p
            style={{
              fontSize: "20px",
              lineHeight: 1.55,
              color: theme["--slide-muted"],
              maxWidth: "800px",
              margin: "0 auto",
            }}
          >
            {intro}
          </p>
        )}
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
          gap: "24px",
          flex: 1,
        }}
      >
        {painPoints.map((pain, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              padding: "28px",
              background: theme["--slide-surface"],
              borderRadius: theme["--slide-radius"],
border: `2px solid ${theme["--slide-danger"]}33`,
              position: "relative",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
              <div
                style={{
                  fontSize: "28px",
                  width: "56px",
                  height: "56px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: theme["--slide-danger"],
                  color: theme["--slide-primary-fg"],
                  borderRadius: "14px",
                  flexShrink: 0,
                }}
              >
                {pain.icon || "⚠"}
              </div>
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontSize: "22px",
                    fontWeight: 600,
                    fontFamily: theme["--slide-font-display"],
                    margin: "0 0 8px 0",
                    color: theme["--slide-danger"],
                  }}
                >
                  {pain.title}
                </h3>
                <p
                  style={{
                    fontSize: "16px",
                    lineHeight: 1.55,
                    color: theme["--slide-text"],
                    margin: 0,
                  }}
                >
                  {pain.text}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}