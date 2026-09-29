"use client";

import * as React from "react";

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
        <h1
          style={{
            fontSize: "48px",
            lineHeight: 1.15,
            fontWeight: 700,
            fontFamily: theme["--slide-font-display"],
            marginBottom: "16px",
            color: theme["--slide-primary"],
          }}
        >
          {headline}
        </h1>
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
          <div
            key={qIndex}
            style={{
              padding: "28px",
              background: theme["--slide-surface"],
              borderRadius: theme["--slide-radius"],
              border: `1px solid ${theme["--slide-muted"]}1a`,
            }}
          >
            <p
              style={{
                fontSize: "22px",
                fontWeight: 600,
                fontFamily: theme["--slide-font-display"],
                marginBottom: "20px",
                color: theme["--slide-text"],
              }}
            >
              {q.question}
            </p>
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
                  {option}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}