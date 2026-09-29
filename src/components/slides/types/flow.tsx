"use client";

import * as React from "react";

interface FlowContent {
  headline: string;
  steps: Array<{
    label: string;
    title: string;
    text: string;
    channel?: string;
  }>;
}

export function FlowSlide({ content, theme }: { content: FlowContent; theme: Record<string, string> }) {
  const { headline, steps } = content;

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
          gap: "24px",
        }}
      >
        {steps.map((step, index) => (
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
                justifyContent: "center",
                minWidth: "80px",
                gap: "8px",
              }}
            >
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: 700,
                  fontFamily: theme["--slide-font-display"],
                  color: theme["--slide-primary"],
                }}
              >
                {step.label}
              </div>
              <div
                style={{
                  width: "4px",
                  height: index < steps.length - 1 ? "60px" : "0",
                  background: theme["--slide-primary"],
                }}
              />
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <h3
                  style={{
                    fontSize: "24px",
                    fontWeight: 600,
                    fontFamily: theme["--slide-font-display"],
                    margin: 0,
                  }}
                >
                  {step.title}
                </h3>
                {step.channel && (
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      padding: "4px 12px",
                      background: theme["--slide-primary"],
                      color: theme["--slide-primary-fg"],
                      borderRadius: "9999px",
                    }}
                  >
                    {step.channel}
                  </span>
                )}
              </div>
              <p
                style={{
                  fontSize: "16px",
                  lineHeight: 1.55,
                  color: theme["--slide-text"],
                  margin: 0,
                }}
              >
                {step.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}