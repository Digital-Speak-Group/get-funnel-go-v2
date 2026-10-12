"use client";

import * as React from "react";
import { cardSurface } from "../style";
import { SlideIcon } from "../icons";
import { EditableText } from "../editable";
import type { SlideIconName } from "@/lib/slides/icons";
import { Frame, Lead, Title, type LayoutProps } from "./parts";

interface CtaContent {
  headline: string;
  sub?: string;
  actions: Array<{ label: string; kind: "calendar" | "link" | "whatsapp" | "form" }>;
}

const actionIcons: Record<CtaContent["actions"][0]["kind"], SlideIconName> = {
  calendar: "calendar-check",
  link: "mouse-pointer-click",
  whatsapp: "message-circle",
  form: "clipboard",
};

// Same rule as the original CTA: buttons follow the theme, WhatsApp keeps its brand green.
const WHATSAPP_GREEN = "#25D366";

function ActionButton({
  action,
  index,
  theme,
  inverted = false,
}: {
  action: CtaContent["actions"][0];
  index: number;
  theme: Record<string, string>;
  inverted?: boolean;
}) {
  const color = action.kind === "whatsapp" ? WHATSAPP_GREEN : theme["--slide-primary"];
  return (
    <button
      type="button"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "14px",
        padding: "22px 36px",
        fontSize: "22px",
        fontWeight: 700,
        fontFamily: theme["--slide-font-display"],
        color: inverted ? color : theme["--slide-primary-fg"],
        background: inverted ? theme["--slide-primary-fg"] : color,
        border: "none",
        borderRadius: theme["--slide-radius"],
        cursor: "pointer",
        boxShadow: `0 8px 24px ${inverted ? "#00000033" : `${color}40`}`,
      }}
    >
      <SlideIcon name={actionIcons[action.kind]} size={26} />
      <EditableText path={`actions.${index}.label`} value={action.label} />
    </button>
  );
}

/** Pitch on the left, the actions in a card on the right. */
export function CtaSplit({ content, theme }: LayoutProps<CtaContent>) {
  const { headline, sub, actions } = content;
  return (
    <Frame theme={theme} style={{ flexDirection: "row", alignItems: "center", gap: "96px" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "28px" }}>
        <Title theme={theme} size={76} path="headline">{headline}</Title>
        <Lead theme={theme} path="sub" style={{ fontSize: "26px" }}>{sub}</Lead>
      </div>
      <div
        style={{
          flex: "0 0 560px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          padding: "48px",
          ...cardSurface(theme),
          borderRadius: theme["--slide-radius"],
          border: `1px solid ${theme["--slide-primary"]}40`,
        }}
      >
        {actions.map((action, i) => (
          <ActionButton key={i} action={action} index={i} theme={theme} />
        ))}
      </div>
    </Frame>
  );
}

/** A full-width band in the theme colours carries the whole call to action. */
export function CtaBanner({ content, theme }: LayoutProps<CtaContent>) {
  const { headline, sub, actions } = content;
  return (
    <Frame theme={theme} style={{ justifyContent: "center", padding: "96px 0" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "64px",
          padding: "88px 120px",
          background: `linear-gradient(120deg, ${theme["--slide-primary"]}, ${theme["--slide-accent"]})`,
          color: theme["--slide-primary-fg"],
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "1000px" }}>
          <EditableText
            as="h1"
            path="headline"
            value={headline}
            style={{ fontSize: "68px", lineHeight: 1.05, fontWeight: 800, fontFamily: theme["--slide-font-display"], margin: 0 }}
          />
          <EditableText
            as="p"
            path="sub"
            value={sub}
            multiline
            style={{ fontSize: "24px", lineHeight: 1.4, margin: 0, opacity: 0.9 }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", flexShrink: 0 }}>
          {actions.map((action, i) => (
            <ActionButton key={i} action={action} index={i} theme={theme} inverted />
          ))}
        </div>
      </div>
    </Frame>
  );
}
