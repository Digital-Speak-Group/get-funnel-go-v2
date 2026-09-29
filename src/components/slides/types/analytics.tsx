"use client";

import * as React from "react";

interface AnalyticsContent {
  headline: string;
  metrics: Array<{
    name: string;
    definition: string;
    target?: string;
  }>;
}

export function AnalyticsSlide({ content, theme }: { content: AnalyticsContent; theme: Record<string, string> }) {
  const { headline, metrics } = content;

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
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "24px",
          flex: 1,
        }}
      >
        {metrics.map((metric, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              padding: "28px",
              background: theme["--slide-surface"],
              borderRadius: theme["--slide-radius"],
              border: `1px solid ${theme["--slide-primary"]}26`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  fontFamily: theme["--slide-font-display"],
                  margin: 0,
                }}
              >
                {metric.name}
              </h3>
              {metric.target && (
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    padding: "4px 10px",
                    background: theme["--slide-success"],
                    color: theme["--slide-primary-fg"],
                    borderRadius: "9999px",
                  }}
                >
                  Cible: {metric.target}
                </span>
              )}
            </div>
            <p
              style={{
                fontSize: "15px",
                lineHeight: 1.55,
                color: theme["--slide-muted"],
                margin: 0,
              }}
            >
              {metric.definition}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}