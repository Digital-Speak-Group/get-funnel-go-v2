"use client";

import * as React from "react";
import { cardSurface, headlineFill } from "../style";
import { EditableText } from "../editable";

interface FaqContent {
  headline: string;
  questions: Array<{
    q: string;
    a: string;
  }>;
}

export function FaqSlide({ content, theme }: { content: FaqContent; theme: Record<string, string> }) {
  const { headline, questions } = content;

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
          gap: "16px",
        }}
      >
        {questions.map((item, index) => (
          <details
            key={index}
            style={{
              ...cardSurface(theme),
              borderRadius: theme["--slide-radius"],
              border: `1px solid ${theme["--slide-muted"]}1a`,
              overflow: "hidden",
            }}
          >
            <summary
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 24px",
                fontSize: "18px",
                fontWeight: 600,
                fontFamily: theme["--slide-font-display"],
                cursor: "pointer",
                listStyle: "none",
              }}
            >
              <EditableText path={`questions.${index}.q`} value={item.q} />
              <span
                style={{
                  fontSize: "20px",
                  color: theme["--slide-primary-text"],
                  flexShrink: 0,
                  marginLeft: "16px",
                }}
              >
                +
              </span>
            </summary>
            <EditableText
              as="div"
              path={`questions.${index}.a`}
              value={item.a}
              multiline
              style={{
                padding: "0 24px 24px 24px",
                fontSize: "16px",
                lineHeight: 1.6,
                color: theme["--slide-text"],
                borderTop: `1px solid ${theme["--slide-muted"]}1a`,
              }}
            />
          </details>
        ))}
      </div>
    </div>
  );
}