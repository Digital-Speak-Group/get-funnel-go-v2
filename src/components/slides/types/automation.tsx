"use client";

import * as React from "react";

interface AutomationContent {
  headline: string;
  items: Array<{
    trigger: string;
    action: string;
    delay?: string;
  }>;
}

export function AutomationSlide({ content, theme }: { content: AutomationContent; theme: Record<string, string> }) {
  const { headline, items } = content;

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
          gap: "20px",
        }}
      >
        {items.map((item, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "24px",
              padding: "24px",
              background: theme["--slide-surface"],
              borderRadius: theme["--slide-radius"],
              border: `1px solid ${theme["--slide-primary"]}26`,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                <span
                  style={{
                    fontSize: "24px",
                    width: "48px",
                    height: "48px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: theme["--slide-success"],
                    color: theme["--slide-primary-fg"],
                    borderRadius: "12px",
                    flexShrink: 0,
                  }}
                >
                  ⚡
                </span>
                <h3
                  style={{
                    fontSize: "20px",
                    fontWeight: 600,
                    fontFamily: theme["--slide-font-display"],
                    margin: 0,
                  }}
                >
                  {item.trigger}
                </h3>
                {item.delay && (
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      padding: "2px 8px",
                      background: theme["--slide-warning"],
                      color: "#000",
                      borderRadius: "9999px",
                    }}
                  >
                    {item.delay}
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: "16px",
                  lineHeight: 1.55,
                  color: theme["--slide-muted"],
                }}
              >
                → {item.action}
              </div>
            </div>
            <div
              style={{
                width: "48px",
                height: "48px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                color: theme["--slide-primary"],
                flexShrink: 0,
              }}
            >
              →
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}