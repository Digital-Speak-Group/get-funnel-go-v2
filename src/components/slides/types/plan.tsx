"use client";

import * as React from "react";

interface PlanContent {
  headline: string;
  phases: Array<{
    name: string;
    duration?: string;
    deliverables: string[];
  }>;
}

export function PlanSlide({ content, theme }: { content: PlanContent; theme: Record<string, string> }) {
  const { headline, phases } = content;

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
          gap: "32px",
        }}
      >
        {phases.map((phase, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              gap: "24px",
              padding: "28px",
              background: theme["--slide-surface"],
              borderRadius: theme["--slide-radius"],
              border: `1px solid ${theme["--slide-primary"]}26`,
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
                minWidth: "160px",
                padding: "16px 20px",
                background: theme["--slide-primary"],
                color: theme["--slide-primary-fg"],
                borderRadius: theme["--slide-radius"],
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  fontFamily: theme["--slide-font-display"],
                }}
              >
                {index + 1}
              </span>
              {phase.duration && (
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    opacity: 0.9,
                  }}
                >
                  {phase.duration}
                </span>
              )}
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
              <h3
                style={{
                  fontSize: "24px",
                  fontWeight: 600,
                  fontFamily: theme["--slide-font-display"],
                  margin: 0,
                }}
              >
                {phase.name}
              </h3>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                {phase.deliverables.map((deliverable, dIndex) => (
                  <span
                    key={dIndex}
                    style={{
                      fontSize: "15px",
                      padding: "8px 14px",
                      background: theme["--slide-bg"],
                      color: theme["--slide-text"],
                      border: `1px solid ${theme["--slide-muted"]}1a`,
                      borderRadius: theme["--slide-radius"],
                      fontWeight: 500,
                    }}
                  >
                    {deliverable}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}