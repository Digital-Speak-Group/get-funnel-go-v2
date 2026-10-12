"use client";

import * as React from "react";
import { cardSurface, headlineFill } from "../style";
import { EditableText, useSlideEditing } from "../editable";

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
  const editing = useSlideEditing();

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
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "24px",
          flex: 1,
          alignContent: "center",
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
              ...cardSurface(theme),
              borderRadius: theme["--slide-radius"],
              border: `1px solid ${theme["--slide-primary"]}26`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <EditableText
                as="h3"
                path={`metrics.${index}.name`}
                value={metric.name}
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  fontFamily: theme["--slide-font-display"],
                  margin: 0,
                }}
              />
              {(metric.target || editing) && (
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
                  Cible: <EditableText path={`metrics.${index}.target`} value={metric.target} />
                </span>
              )}
            </div>
            <EditableText
              as="p"
              path={`metrics.${index}.definition`}
              value={metric.definition}
              multiline
              style={{
                fontSize: "15px",
                lineHeight: 1.55,
                color: theme["--slide-muted"],
                margin: 0,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}