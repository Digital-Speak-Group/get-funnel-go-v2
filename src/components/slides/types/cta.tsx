"use client";

import * as React from "react";
import { headlineFill } from "../style";
import { SlideIcon } from "../icons";
import { EditableText, useSlideEditing } from "../editable";
import type { SlideIconName } from "@/lib/slides/icons";

interface CtaContent {
  headline: string;
  sub?: string;
  actions: Array<{
    label: string;
    kind: "calendar" | "link" | "whatsapp" | "form";
    url?: string;
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
  const isEditing = useSlideEditing();

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
        <EditableText
          as="h1"
          path="headline"
          value={headline}
          style={{
            fontSize: "56px",
            lineHeight: 1.05,
            fontWeight: 800,
            marginBottom: "24px",
            ...headlineFill(theme, theme["--slide-text"]),
          }}
        />
        <EditableText
          as="p"
          path="sub"
          value={sub}
          multiline
          style={{
            fontSize: "22px",
            lineHeight: 1.4,
            fontWeight: 400,
            color: theme["--slide-muted"],
          }}
        />
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
          const hasUrl = Boolean(action.url);
          const Component = hasUrl ? "a" : "button";

          return (
            <Component
              key={index}
              {...(hasUrl
                ? {
                    href: action.url,
                    target: "_blank",
                    rel: "noopener noreferrer",
                    onClick: isEditing ? (e: React.MouseEvent) => e.preventDefault() : undefined,
                  }
                : { type: "button" })}
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
                textDecoration: "none",
                transition: "transform 150ms ease, box-shadow 150ms ease",
                boxShadow: `0 4px 16px ${color}40`,
              }}
            >
              <SlideIcon name={actionIcons[action.kind]} size={24} />
              <EditableText path={`actions.${index}.label`} value={action.label} />
            </Component>
          );
        })}
      </div>
    </div>
  );
}

