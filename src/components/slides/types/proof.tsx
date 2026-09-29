"use client";

import * as React from "react";

interface ProofContent {
  headline: string;
  items: Array<{
    quote?: string;
    name: string;
    role?: string;
    result?: string;
  }>;
}

export function ProofSlide({ content, theme }: { content: ProofContent; theme: Record<string, string> }) {
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
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
          gap: "24px",
          flex: 1,
        }}
      >
        {items.map((item, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              padding: "28px",
              background: theme["--slide-surface"],
              borderRadius: theme["--slide-radius"],
              border: `1px solid ${theme["--slide-success"]}26`,
            }}
          >
            {item.quote && (
              <blockquote
                style={{
                  fontSize: "17px",
                  lineHeight: 1.6,
                  fontStyle: "italic",
                  color: theme["--slide-text"],
                  margin: 0,
                  paddingLeft: "16px",
                  borderLeft: `3px solid ${theme["--slide-success"]}`,
                }}
              >
                "{item.quote}"
              </blockquote>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${theme["--slide-primary"]}, ${theme["--slide-accent"]})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  fontWeight: 700,
                  color: theme["--slide-primary-fg"],
                  flexShrink: 0,
                }}
              >
                {item.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p
                  style={{
                    fontSize: "17px",
                    fontWeight: 600,
                    fontFamily: theme["--slide-font-display"],
                    margin: "0 0 4px 0",
                  }}
                >
                  {item.name}
                </p>
                {item.role && (
                  <p style={{ fontSize: "14px", color: theme["--slide-muted"], margin: 0 }}>
                    {item.role}
                  </p>
                )}
                {item.result && (
                  <p
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: theme["--slide-success"],
                      margin: "4px 0 0 0",
                    }}
                  >
                    {item.result}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}