"use client";

import * as React from "react";
import { cardSurface, headlineFill } from "../style";
import { EditableItem, EditableText } from "../editable";

interface QualificationContent {
  headline: string;
  questions: Array<{
    question: string;
    options: string[];
  }>;
}

export function QualificationSlide({ content, theme }: { content: QualificationContent; theme: Record<string, string> }) {
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
          gap: "32px",
        }}
      >
        {questions.map((q, qIndex) => (
          <EditableItem path="questions" index={qIndex} length={questions.length}
            key={qIndex}
            style={{
              padding: "28px",
              ...cardSurface(theme),
              borderRadius: theme["--slide-radius"],
              border: `1px solid ${theme["--slide-muted"]}1a`,
            }}
          >
            <EditableText
              as="p"
              path={`questions.${qIndex}.question`}
              value={q.question}
              style={{
                fontSize: "22px",
                fontWeight: 600,
                fontFamily: theme["--slide-font-display"],
                marginBottom: "20px",
                color: theme["--slide-text"],
              }}
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(auto-fit, minmax(200px, 1fr))`,
                gap: "12px",
              }}
            >
              {q.options.map((option, oIndex) => (
                <button
                  key={oIndex}
                  type="button"
                  style={{
                    padding: "14px 20px",
                    fontSize: "15px",
                    fontWeight: 500,
                    fontFamily: theme["--slide-font-body"],
                    color: theme["--slide-text"],
                    background: theme["--slide-bg"],
                    border: `2px solid ${theme["--slide-muted"]}33`,
                    borderRadius: theme["--slide-radius"],
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "border-color 200ms ease, background 200ms ease",
                  }}
                >
                  <EditableText path={`questions.${qIndex}.options.${oIndex}`} value={option} />
                </button>
              ))}
            </div>
          </EditableItem>
        ))}
      </div>
    </div>
  );
}