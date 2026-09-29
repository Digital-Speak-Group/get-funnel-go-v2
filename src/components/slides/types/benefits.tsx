"use client";

import * as React from "react";

interface BenefitsContent {
  headline: string;
  benefits: Array<{
    icon?: string;
    title: string;
    text: string;
  }>;
}

export function BenefitsSlide({ content, theme }: { content: BenefitsContent; theme: Record<string, string> }) {
  const { headline, benefits } = content;

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
            color: theme["--slide-success"],
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
        {benefits.map((benefit, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              padding: "28px",
              background: theme["--slide-surface"],
              borderRadius: theme["--slide-radius"],
              border: `1px solid ${theme["--slide-success"]}26`,
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
              <div
                style={{
                  fontSize: "24px",
                  width: "52px",
                  height: "52px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: theme["--slide-success"],
                  color: theme["--slide-primary-fg"],
                  borderRadius: "13px",
                  flexShrink: 0,
                }}
              >
                {benefit.icon || "✓"}
              </div>
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontSize: "22px",
                    fontWeight: 600,
                    fontFamily: theme["--slide-font-display"],
                    margin: "0 0 8px 0",
                    color: theme["--slide-success"],
                  }}
                >
                  {benefit.title}
                </h3>
                <p
                  style={{
                    fontSize: "16px",
                    lineHeight: 1.55,
                    color: theme["--slide-text"],
                    margin: 0,
                  }}
                >
                  {benefit.text}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}