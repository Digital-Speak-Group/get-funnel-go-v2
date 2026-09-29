"use client";

import * as React from "react";

interface TeamContent {
  headline: string;
  members: Array<{
    name: string;
    role: string;
    proof?: string;
  }>;
}

export function TeamSlide({ content, theme }: { content: TeamContent; theme: Record<string, string> }) {
  const { headline, members } = content;

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
          gridTemplateColumns: `repeat(auto-fit, minmax(280px, 1fr))`,
          gap: "24px",
          flex: 1,
        }}
      >
        {members.map((member, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: "16px",
              padding: "28px",
              background: theme["--slide-surface"],
              borderRadius: theme["--slide-radius"],
              border: `1px solid ${theme["--slide-muted"]}1a`,
            }}
          >
            <div
              style={{
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${theme["--slide-primary"]}, ${theme["--slide-accent"]})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "32px",
                fontWeight: 700,
                color: theme["--slide-primary-fg"],
                flexShrink: 0,
              }}
            >
              {member.name.charAt(0).toUpperCase()}
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
                {member.name}
              </h3>
              <p
                style={{
                  fontSize: "15px",
                  fontWeight: 500,
                  color: theme["--slide-primary"],
                  margin: 0,
                }}
              >
                {member.role}
              </p>
            </div>
            {member.proof && (
              <p
                style={{
                  fontSize: "14px",
                  lineHeight: 1.5,
                  color: theme["--slide-muted"],
                  margin: 0,
                  maxWidth: "240px",
                }}
              >
                {member.proof}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}