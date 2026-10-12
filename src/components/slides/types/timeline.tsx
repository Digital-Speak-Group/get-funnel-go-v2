"use client";

import * as React from "react";
import { headlineFill } from "../style";
import { EditableText } from "../editable";

interface TimelineContent {
  headline: string;
  milestones: Array<{
    when: string;
    title: string;
    text?: string;
  }>;
}

export function TimelineSlide({ content, theme }: { content: TimelineContent; theme: Record<string, string> }) {
  const { headline, milestones } = content;

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
          gap: "0",
        }}
      >
        {milestones.map((ms, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              gap: "24px",
              padding: "24px 0",
              position: "relative",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: "120px", flexShrink: 0 }}>
              <EditableText
                as="div"
                path={`milestones.${index}.when`}
                value={ms.when}
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: theme["--slide-primary-text"],
                  marginBottom: "8px",
                  textAlign: "center",
                }}
              />
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  background: theme["--slide-primary"],
                  border: `3px solid ${theme["--slide-bg"]}`,
                  boxShadow: `0 0 0 2px ${theme["--slide-primary"]}`,
                  zIndex: 1,
                }}
              />
              {index < milestones.length - 1 && (
                <div
                  style={{
                    width: "3px",
                    flex: 1,
                    background: `linear-gradient(to bottom, ${theme["--slide-primary"]}, ${theme["--slide-muted"]}33)`,
                    margin: "0 6px",
                  }}
                />
              )}
            </div>
            <div style={{ flex: 1, paddingTop: "8px" }}>
              <EditableText
                as="h3"
                path={`milestones.${index}.title`}
                value={ms.title}
                style={{
                  fontSize: "22px",
                  fontWeight: 600,
                  fontFamily: theme["--slide-font-display"],
                  margin: "0 0 8px 0",
                  color: theme["--slide-text"],
                }}
              />
              <EditableText
                as="p"
                path={`milestones.${index}.text`}
                value={ms.text}
                multiline
                style={{
                  fontSize: "16px",
                  lineHeight: 1.55,
                  color: theme["--slide-muted"],
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