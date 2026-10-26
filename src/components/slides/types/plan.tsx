"use client";

import * as React from "react";
import { cardSurface, headlineFill } from "../style";
import { EditableItem, EditableText } from "../editable";

interface PlanContent {
  headline: string;
  phases: Array<{
    name: string;
    duration?: string;
    deliverables: string[];
  }>;
}

export function PlanSlide({ content, theme }: { content: PlanContent; theme: Record<string, string> }) {
  const { headline, phases } = content;

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
          gap: "32px",
        }}
      >
        {phases.map((phase, index) => (
          <EditableItem path="phases" index={index} length={phases.length}
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
                justifyContent: "flex-start",
                minWidth: "160px",
                padding: "16px 20px",
                background: theme["--slide-primary"],
                color: theme["--slide-primary-fg"],
                borderRadius: theme["--slide-radius"],
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  fontFamily: theme["--slide-font-display"],
                }}
              >
                {index + 1}
              </span>
              <EditableText
                as="span"
                path={`phases.${index}.duration`}
                value={phase.duration}
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  opacity: 0.9,
                }}
              />
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
              <EditableText
                as="h3"
                path={`phases.${index}.name`}
                value={phase.name}
                style={{
                  fontSize: "24px",
                  fontWeight: 600,
                  fontFamily: theme["--slide-font-display"],
                  margin: 0,
                }}
              />
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                {phase.deliverables.map((deliverable, dIndex) => (
                  <EditableItem
                    as="span"
                    path={`phases.${index}.deliverables`}
                    index={dIndex}
                    length={phase.deliverables.length}
                    key={dIndex}
                    style={{
                      fontSize: "15px",
                      padding: "8px 14px",
                      background: theme["--slide-bg"],
                      color: theme["--slide-text"],
                      border: `1px solid ${theme["--slide-muted"]}1a`,
                      borderRadius: theme["--slide-radius"],
                      fontWeight: 500,
                    }}
                  >
                    <EditableText path={`phases.${index}.deliverables.${dIndex}`} value={deliverable} />
                  </EditableItem>
                ))}
              </div>
            </div>
          </EditableItem>
        ))}
      </div>
    </div>
  );
}