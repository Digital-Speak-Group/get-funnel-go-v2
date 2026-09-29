"use client";

import * as React from "react";

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
        <h1
          style={{
            fontSize: "48px",
            lineHeight: 1.15,
            fontWeight: 700,
            fontFamily: theme["--slide-font-display"],
            marginBottom: "24px",
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
          gap: "48px",
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            fontSize: "22px",
            lineHeight: 1.55,
            color: theme["--slide-text"],
            textAlign: "center",
            padding: "32px",
            background: theme["--slide-surface"],
            borderRadius: theme["--slide-radius"],
            border: `1px solid ${theme["--slide-muted"]}1a`,
          }}
        >
          {body}
        </div>

        {pillars && pillars.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${pillars.length}, 1fr)`,
              gap: "24px",
            }}
          >
            {pillars.map((pillar, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  gap: "16px",
                  padding: "24px",
                  background: theme["--slide-surface"],
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
                    {pillar.icon}
                  </span>
                )}
                <h3
                  style={{
                    fontSize: "20px",
                    fontWeight: 600,
                    fontFamily: theme["--slide-font-display"],
                    margin: 0,
                  }}
                >
                  {pillar.title}
                </h3>
                <p
                  style={{
                    fontSize: "16px",
                    lineHeight: 1.55,
                    color: theme["--slide-muted"],
                    margin: 0,
                  }}
                >
                  {pillar.text}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}