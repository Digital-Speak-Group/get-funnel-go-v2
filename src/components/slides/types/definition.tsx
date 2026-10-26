"use client";

import * as React from "react";
import { cardSurface, headlineFill } from "../style";
import { SlideIcon } from "../icons";
import { EditableItem, EditableText } from "../editable";

interface DefinitionContent {
  headline: string;
  body: string;
  pillars?: Array<{
    icon?: string;
    title: string;
    text: string;
  }>;
}

export function DefinitionSlide({ content, theme }: { content: DefinitionContent; theme: Record<string, string> }) {
  const { headline, body, pillars } = content;

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
            ...headlineFill(theme, theme["--slide-text"]),
            fontSize: "48px",
            lineHeight: 1.15,
            fontWeight: 700,
            fontFamily: theme["--slide-font-display"],
            marginBottom: "24px",
          }}
        />
      </header>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "48px",
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        <EditableText
          as="div"
          path="body"
          value={body}
          multiline
          style={{
            fontSize: "22px",
            lineHeight: 1.55,
            color: theme["--slide-text"],
            textAlign: "center",
            padding: "32px",
            ...cardSurface(theme),
            borderRadius: theme["--slide-radius"],
            border: `1px solid ${theme["--slide-muted"]}1a`,
          }}
        />

        {pillars && pillars.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${pillars.length}, 1fr)`,
              gap: "24px",
            }}
          >
            {pillars.map((pillar, index) => (
              <EditableItem path="pillars" index={index} length={pillars.length}
                key={index}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  gap: "16px",
                  padding: "24px",
                  ...cardSurface(theme),
                  borderRadius: theme["--slide-radius"],
                  border: `1px solid ${theme["--slide-muted"]}1a`,
                }}
              >
                {pillar.icon && (
                  <span
                    style={{
                      fontSize: "28px",
                      width: "64px",
                      height: "64px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: theme["--slide-primary"],
                      color: theme["--slide-primary-fg"],
                      borderRadius: "16px",
                    }}
                  >
                    <SlideIcon name={pillar.icon} size={28} fallback="✓" />
                  </span>
                )}
                <EditableText
                  as="h3"
                  path={`pillars.${index}.title`}
                  value={pillar.title}
                  style={{
                    fontSize: "20px",
                    fontWeight: 600,
                    fontFamily: theme["--slide-font-display"],
                    margin: 0,
                  }}
                />
                <EditableText
                  as="p"
                  path={`pillars.${index}.text`}
                  value={pillar.text}
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
        )}
      </div>
    </div>
  );
}