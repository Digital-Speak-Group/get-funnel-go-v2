"use client";

import * as React from "react";
import { headlineFill } from "../style";
import { SlideIcon } from "../icons";
import type { SlideIconName } from "@/lib/slides/icons";

interface CtaContent {
  headline: string;
  sub?: string;
  actions: Array<{
    label: string;
    kind: "calendar" | "link" | "whatsapp" | "form";
  }>;
}

const actionIcons: Record<CtaContent["actions"][0]["kind"], SlideIconName> = {
  calendar: "calendar-check",
  link: "mouse-pointer-click",
  whatsapp: "message-circle",
  form: "clipboard",
};

// Buttons follow the deck theme; WhatsApp keeps its recognisable brand green.
const WHATSAPP_GREEN = "#25D366";

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
            ...headlineFill(theme, theme["--slide-text"]),
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
          const color = action.kind === "whatsapp" ? WHATSAPP_GREEN : theme["--slide-primary"];
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
                color: theme["--slide-primary-fg"],
                background: color,
                border: "none",
                borderRadius: theme["--slide-radius"],
                cursor: "pointer",
                transition: "transform 150ms ease, box-shadow 150ms ease",
                boxShadow: `0 4px 16px ${color}40`,
              }}
            >
              <SlideIcon name={actionIcons[action.kind]} size={24} />
              {action.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}