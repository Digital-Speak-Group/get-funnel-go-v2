"use client";

import * as React from "react";

interface PricingContent {
  headline: string;
  tiers: Array<{
    name: string;
    price?: string;
    features: string[];
    highlight?: boolean;
  }>;
}

export function PricingSlide({ content, theme }: { content: PricingContent; theme: Record<string, string> }) {
  const { headline, tiers } = content;

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
          gridTemplateColumns: `repeat(${tiers.length}, 1fr)`,
          gap: "24px",
          flex: 1,
          alignItems: "stretch",
        }}
      >
        {tiers.map((tier, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "32px",
              background: tier.highlight
                ? `linear-gradient(135deg, ${theme["--slide-primary"]}15, ${theme["--slide-accent"]}15)`
                : theme["--slide-surface"],
              borderRadius: theme["--slide-radius"],
              border: tier.highlight
                ? `2px solid ${theme["--slide-primary"]}`
                : `1px solid ${theme["--slide-muted"]}1a`,
              position: "relative",
            }}
          >
            {tier.highlight && (
              <div
                style={{
                  position: "absolute",
                  top: "-12px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  padding: "4px 16px",
                  background: theme["--slide-primary"],
                  color: theme["--slide-primary-fg"],
                  fontSize: "12px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  borderRadius: "9999px",
                }}
              >
                Recommandé
              </div>
            )}
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <h3
                style={{
                  fontSize: "22px",
                  fontWeight: 600,
                  fontFamily: theme["--slide-font-display"],
                  margin: "0 0 8px 0",
                }}
              >
                {tier.name}
              </h3>
              {tier.price && (
                <div
                  style={{
                    fontSize: "42px",
                    fontWeight: 800,
                    fontFamily: theme["--slide-font-display"],
                    color: tier.highlight ? theme["--slide-primary"] : theme["--slide-text"],
                  }}
                >
                  {tier.price}
                </div>
              )}
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, flex: 1, display: "flex", flexDirection: "column", gap: "14px" }}>
              {tier.features.map((feature, fIndex) => (
                <li
                  key={fIndex}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    fontSize: "16px",
                    lineHeight: 1.5,
                    paddingLeft: "8px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "18px",
                      color: theme["--slide-success"],
                      flexShrink: 0,
                      marginTop: "2px",
                    }}
                  >
                    ✓
                  </span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}