"use client";

import * as React from "react";
import { cardSurface, headlineFill } from "../style";
import { EditableText } from "../editable";

interface CrmContent {
  headline: string;
  pipelines: Array<{
    stage: string;
    definition: string;
  }>;
}

export function CrmSlide({ content, theme }: { content: CrmContent; theme: Record<string, string> }) {
  const { headline, pipelines } = content;

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
          gap: "20px",
        }}
      >
        {pipelines.map((pipe, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "24px",
              padding: "24px",
              ...cardSurface(theme),
              borderRadius: theme["--slide-radius"],
              border: `1px solid ${theme["--slide-primary"]}26`,
            }}
          >
            <EditableText
              as="div"
              path={`pipelines.${index}.stage`}
              value={pipe.stage}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: "140px",
                padding: "12px 20px",
                background: theme["--slide-primary"],
                color: theme["--slide-primary-fg"],
                borderRadius: theme["--slide-radius"],
                fontSize: "16px",
                fontWeight: 600,
                fontFamily: theme["--slide-font-display"],
                flexShrink: 0,
                textAlign: "center",
              }}
            />
            <div
              style={{
                flex: 1,
                padding: "16px",
                background: theme["--slide-bg"],
                borderRadius: theme["--slide-radius"],
                border: `1px solid ${theme["--slide-muted"]}1a`,
              }}
            >
              <EditableText
                as="p"
                path={`pipelines.${index}.definition`}
                value={pipe.definition}
                multiline
                style={{ margin: 0, lineHeight: 1.55, fontSize: "16px" }}
              />
            </div>
            {index < pipelines.length - 1 && (
              <div
                style={{
                  width: "40px",
                  height: "3px",
                  background: `linear-gradient(90deg, ${theme["--slide-primary"]}, ${theme["--slide-accent"]})`,
                  borderRadius: "2px",
                  flexShrink: 0,
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}