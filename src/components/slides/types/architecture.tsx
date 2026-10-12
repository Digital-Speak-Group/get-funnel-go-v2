"use client";

import * as React from "react";
import { cardSurface, headlineFill } from "../style";
import { EditableText } from "../editable";

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
        <EditableText
          as="h1"
          path="headline"
          value={headline}
          style={{
            fontSize: "48px",
            lineHeight: 1.15,
            fontWeight: 700,
            fontFamily: theme["--slide-font-display"],
            marginBottom: "16px",
            ...headlineFill(theme, theme["--slide-primary-text"]),
          }}
        />
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
              ...cardSurface(theme),
              borderRadius: theme["--slide-radius"],
              border: `1px solid ${theme["--slide-muted"]}1a`,
            }}
          >
            <EditableText
              as="div"
              path={`layers.${layerIndex}.name`}
              value={layer.name}
              style={{
                fontSize: "20px",
                fontWeight: 600,
                fontFamily: theme["--slide-font-display"],
                color: theme["--slide-primary-text"],
                paddingBottom: "8px",
                borderBottom: `2px solid ${theme["--slide-primary"]}`,
                display: "inline-block",
              }}
            />
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              {layer.items.map((item, itemIndex) => (
                <EditableText
                  key={itemIndex}
                  path={`layers.${layerIndex}.items.${itemIndex}`}
                  value={item}
                  style={{
                    fontSize: "15px",
                    padding: "8px 16px",
                    background: theme["--slide-primary"],
                    color: theme["--slide-primary-fg"],
                    borderRadius: theme["--slide-radius"],
                    fontWeight: 500,
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}