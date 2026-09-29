"use client";

import * as React from "react";

interface KpiContent {
  headline: string;
  metrics: Array<{
    value: string;
    label: string;
    delta?: string;
  }>;
}

export function KpiSlide({ content, theme }: { content: KpiContent; theme: Record<string, string> }) {
  const { headline, metrics } = content;

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
      <header style={{ marginBottom: "64px" }}>
        <h1
          style={{
            fontSize: "48px",
            lineHeight: 1.15,
            fontWeight: 700,
            marginBottom: "16px",
            color: theme["--slide-primary"],
          }}
        >
          {headline}
        </h1>
      </header>

      <div
        style={{
          display: "flex",
          gap: "48px",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {metrics.map((metric, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
              minWidth: "200px",
            }}
          >
            <div
              style={{
                fontSize: "72px",
                fontWeight: 800,
                lineHeight: 1,
                color: theme["--slide-text"],
              }}
            >
              {metric.value}
            </div>
            <div
              style={{
                fontSize: "20px",
                fontWeight: 500,
                color: theme["--slide-muted"],
              }}
            >
              {metric.label}
            </div>
            {metric.delta && (
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  padding: "4px 12px",
                  background: theme["--slide-success"],
                  color: theme["--slide-primary-fg"],
                  borderRadius: "9999px",
                }}
              >
                {metric.delta}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}