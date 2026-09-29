"use client";

import * as React from "react";

interface CtaContent {
  headline: string;
  sub?: string;
  actions: Array<{
    label: string;
    kind: "calendar" | "link" | "whatsapp" | "form";
  }>;
}

const actionIcons: Record<CtaContent["actions"][0]["kind"], string> = {
  calendar: "📅",
  link: "🔗",
  whatsapp: "💬",
  form: "📝",
};

const actionColors: Record<CtaContent["actions"][0]["kind"], string> = {
  calendar: "#4285F4",
  link: "#8B5CF6",
  whatsapp: "#25D366",
  form: "#F59E0B",
};

export function CtaSlide({ content, theme }: { content: CtaContent; theme: Record<string, string> }) {
  const { headline, sub, actions } = content;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
        padding: "96px",
        textAlign: "center",
        fontFamily: theme["--slide-font-display"],
        color: theme["--slide-text"],
      }}
    >
      <header style={{ marginBottom: "48px", maxWidth: "800px" }}>
        <h1
          style={{
            fontSize: "56px",
            lineHeight: 1.05,
            fontWeight: 800,
            marginBottom: "24px",
            color: theme["--slide-text"],
          }}
        >
          {headline}
        </h1>
        {sub && (
          <p
            style={{
              fontSize: "22px",
              lineHeight: 1.4,
              fontWeight: 400,
              color: theme["--slide-muted"],
            }}
          >
            {sub}
          </p>
        )}
      </header>

      <div
        style={{
          display: "flex",
          gap: "24px",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {actions.map((action, index) => {
          const color = actionColors[action.kind];
          return (
            <button
              key={index}
              type="button"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "12px",
                padding: "18px 32px",
                fontSize: "18px",
                fontWeight: 600,
                fontFamily: theme["--slide-font-display"],
                color: "#fff",
                background: color,
                border: "none",
                borderRadius: theme["--slide-radius"],
                cursor: "pointer",
                transition: "transform 150ms ease, box-shadow 150ms ease",
                boxShadow: `0 4px 16px ${color}40`,
              }}
            >
              <span style={{ fontSize: "24px" }}>{actionIcons[action.kind]}</span>
              {action.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}