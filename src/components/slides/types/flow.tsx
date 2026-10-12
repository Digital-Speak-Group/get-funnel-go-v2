"use client";

import * as React from "react";
import { cardSurface, headlineFill } from "../style";
import { EditableText } from "../editable";

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
  const twoColumns = steps.length > 4;

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
          display: "grid",
          // Long flows (5–7 steps) read top-to-bottom in two columns so they fit the 1080px canvas.
          gridTemplateRows: `repeat(${twoColumns ? Math.ceil(steps.length / 2) : steps.length}, auto)`,
          gridAutoFlow: "column",
          gridAutoColumns: "1fr",
          alignContent: "center",
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
              ...cardSurface(theme),
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
              <EditableText
                as="div"
                path={`steps.${index}.label`}
                value={step.label}
                style={{
                  fontSize: "28px",
                  fontWeight: 700,
                  fontFamily: theme["--slide-font-display"],
                  color: theme["--slide-primary-text"],
                }}
              />
              <div
                style={{
                  width: "4px",
                  height: !twoColumns && index < steps.length - 1 ? "60px" : "0",
                  background: theme["--slide-primary"],
                }}
              />
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <EditableText
                  as="h3"
                  path={`steps.${index}.title`}
                  value={step.title}
                  style={{
                    fontSize: "24px",
                    fontWeight: 600,
                    fontFamily: theme["--slide-font-display"],
                    margin: 0,
                  }}
                />
                <EditableText
                  path={`steps.${index}.channel`}
                  value={step.channel}
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
                />
              </div>
              <EditableText
                as="p"
                path={`steps.${index}.text`}
                value={step.text}
                multiline
                style={{
                  fontSize: "16px",
                  lineHeight: 1.55,
                  color: theme["--slide-text"],
                  margin: 0,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}