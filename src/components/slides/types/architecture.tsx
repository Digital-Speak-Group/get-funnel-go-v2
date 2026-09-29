"use client";

import * as React from "react";

interface ArchitectureContent {
  headline: string;
  layers: Array<{
    name: string;
    items: string[];
  }>;
}

export function ArchitectureSlide({ content, theme }: { content: ArchitectureContent; theme: Record<string, string> }) {
  const { headline, layers } = content;

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
        {layers.map((layer, layerIndex) => (
          <div
            key={layerIndex}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              padding: "24px",
              background: theme["--slide-surface"],
              borderRadius: theme["--slide-radius"],
              border: `1px solid ${theme["--slide-muted"]}1a`,
            }}
          >
            <div
              style={{
                fontSize: "20px",
                fontWeight: 600,
                fontFamily: theme["--slide-font-display"],
                color: theme["--slide-primary"],
                paddingBottom: "8px",
                borderBottom: `2px solid ${theme["--slide-primary"]}`,
                display: "inline-block",
              }}
            >
              {layer.name}
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              {layer.items.map((item, itemIndex) => (
                <span
                  key={itemIndex}
                  style={{
                    fontSize: "15px",
                    padding: "8px 16px",
                    background: theme["--slide-primary"],
                    color: theme["--slide-primary-fg"],
                    borderRadius: theme["--slide-radius"],
                    fontWeight: 500,
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}