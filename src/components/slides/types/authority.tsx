"use client";

import * as React from "react";
import { cardSurface, headlineFill } from "../style";
import { SlideIcon } from "../icons";
import { EditableItem, EditableText } from "../editable";

interface AuthorityContent {
  headline: string;
  points: Array<{
    icon?: string;
    title: string;
    text: string;
  }>;
}

export function AuthoritySlide({ content, theme }: { content: AuthorityContent; theme: Record<string, string> }) {
  const { headline, points } = content;

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
      <header style={{ marginBottom: "64px", textAlign: "center" }}>
        <EditableText
          as="h1"
          path="headline"
          value={headline}
          style={{
            ...headlineFill(theme, theme["--slide-text"]),
            fontSize: "48px",
            lineHeight: 1.15,
            fontWeight: 700,
            fontFamily: theme["--slide-font-display"],
            marginBottom: "16px",
          }}
        />
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "32px",
          flex: 1,
          alignContent: "center",
        }}
      >
        {points.map((point, index) => (
<EditableItem path="points" index={index} length={points.length}
              key={index}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                padding: "24px",
                ...cardSurface(theme),
                borderRadius: theme["--slide-radius"],
                border: `1px solid ${theme["--slide-muted"]}33`,
              }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {point.icon && (
                <span
                  style={{
                    fontSize: "24px",
                    width: "48px",
                    height: "48px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: theme["--slide-primary"],
                    color: theme["--slide-primary-fg"],
                    borderRadius: "12px",
                  }}
                >
                  <SlideIcon name={point.icon} size={24} fallback="✓" />
                </span>
              )}
              <EditableText
                as="h3"
                path={`points.${index}.title`}
                value={point.title}
                style={{
                  fontSize: "22px",
                  fontWeight: 600,
                  fontFamily: theme["--slide-font-display"],
                  margin: 0,
                }}
              />
            </div>
            <EditableText
              as="p"
              path={`points.${index}.text`}
              value={point.text}
              multiline
              style={{
                fontSize: "16px",
                lineHeight: 1.55,
                color: theme["--slide-muted"],
                margin: 0,
              }}
            />
          </EditableItem>
        ))}
      </div>
    </div>
  );
}