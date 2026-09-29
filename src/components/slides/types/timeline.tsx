"use client";

import * as React from "react";

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
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: theme["--slide-primary"],
                  marginBottom: "8px",
                  textAlign: "center",
                }}
              >
                {ms.when}
              </div>
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
              <h3
                style={{
                  fontSize: "22px",
                  fontWeight: 600,
                  fontFamily: theme["--slide-font-display"],
                  margin: "0 0 8px 0",
                  color: theme["--slide-text"],
                }}
              >
                {ms.title}
              </h3>
              {ms.text && (
                <p
                  style={{
                    fontSize: "16px",
                    lineHeight: 1.55,
                    color: theme["--slide-muted"],
                    margin: 0,
                  }}
                >
                  {ms.text}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}