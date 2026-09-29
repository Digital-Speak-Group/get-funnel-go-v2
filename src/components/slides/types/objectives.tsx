"use client";

import * as React from "react";

interface ObjectivesContent {
  headline: string;
  goals: Array<{
    label: string;
    target: string;
    text: string;
  }>;
}

export function ObjectivesSlide({ content, theme }: { content: ObjectivesContent; theme: Record<string, string> }) {
  const { headline, goals } = content;

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
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "24px",
          flex: 1,
        }}
      >
        {goals.map((goal, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              padding: "28px",
              background: theme["--slide-surface"],
              borderRadius: theme["--slide-radius"],
              border: `1px solid ${theme["--slide-primary"]}26`,
              position: "relative",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div
                style={{
                  fontSize: "24px",
                  width: "52px",
                  height: "52px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: theme["--slide-primary"],
                  color: theme["--slide-primary-fg"],
                  borderRadius: "13px",
                  flexShrink: 0,
                }}
              >
                {index + 1}
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "22px",
                    fontWeight: 600,
                    fontFamily: theme["--slide-font-display"],
                    margin: "0 0 4px 0",
                  }}
                >
                  {goal.label}
                </h3>
                <p
                  style={{
                    fontSize: "16px",
                    fontWeight: 500,
                    color: theme["--slide-primary"],
                    margin: 0,
                  }}
                >
                  {goal.target}
                </p>
              </div>
            </div>
            <p
              style={{
                fontSize: "16px",
                lineHeight: 1.55,
                color: theme["--slide-text"],
                margin: 0,
              }}
            >
              {goal.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}