"use client";

import * as React from "react";
import { cardSurface } from "../style";
import { Frame, Title, type LayoutProps } from "./parts";

interface FlowContent {
  headline: string;
  steps: Array<{ label: string; title: string; text: string; channel?: string }>;
}

function ChannelPill({ theme, children }: { theme: Record<string, string>; children: React.ReactNode }) {
  return (
    <span
      style={{
        alignSelf: "flex-start",
        fontSize: "12px",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        padding: "4px 12px",
        background: `${theme["--slide-primary"]}26`,
        color: theme["--slide-primary-text"],
        borderRadius: "9999px",
      }}
    >
      {children}
    </span>
  );
}

/** Horizontal timeline: one column per step, joined by a line through numbered nodes; the step label sits under its node. */
export function FlowTimeline({ content, theme }: LayoutProps<FlowContent>) {
  const { headline, steps } = content;
  const primary = theme["--slide-primary"];
  return (
    <Frame theme={theme} style={{ justifyContent: "center", gap: "72px" }}>
      <Title theme={theme} size={52} align="center" color={theme["--slide-primary-text"]}>{headline}</Title>
      <div style={{ position: "relative", display: "grid", gridTemplateColumns: `repeat(${steps.length}, 1fr)`, gap: "24px" }}>
        {/* The line runs between the first and last node centres. */}
        <div
          style={{
            position: "absolute",
            top: "35px",
            left: `calc(100% / ${steps.length * 2})`,
            right: `calc(100% / ${steps.length * 2})`,
            height: "3px",
            background: `linear-gradient(90deg, ${primary}, ${theme["--slide-accent"]})`,
          }}
        />
        {steps.map((step, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "16px" }}>
            <div
              style={{
                position: "relative",
                width: "72px",
                height: "72px",
                borderRadius: "9999px",
                background: primary,
                color: theme["--slide-primary-fg"],
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
                fontWeight: 800,
                fontFamily: theme["--slide-font-display"],
                boxShadow: `0 0 0 8px ${theme["--slide-bg"]}`,
              }}
            >
              {i + 1}
            </div>
            <span
              style={{
                fontSize: "14px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: theme["--slide-primary-text"],
              }}
            >
              {step.label}
            </span>
            <h3 style={{ fontSize: "22px", fontWeight: 700, fontFamily: theme["--slide-font-display"], margin: 0 }}>{step.title}</h3>
            {step.channel && <ChannelPill theme={theme}>{step.channel}</ChannelPill>}
            <p style={{ fontSize: "16px", lineHeight: 1.5, color: theme["--slide-muted"], margin: 0 }}>{step.text}</p>
          </div>
        ))}
      </div>
    </Frame>
  );
}

/** Numbered cards on a grid (3 or 4 per row), the label as a large index. */
export function FlowGrid({ content, theme }: LayoutProps<FlowContent>) {
  const { headline, steps } = content;
  const columns = steps.length === 4 || steps.length > 6 ? 4 : 3;
  return (
    <Frame theme={theme} style={{ gap: "48px" }}>
      <Title theme={theme} size={52} color={theme["--slide-primary-text"]}>{headline}</Title>
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: "24px",
          alignContent: "center",
        }}
      >
        {steps.map((step, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              padding: "32px",
              ...cardSurface(theme),
              borderRadius: theme["--slide-radius"],
              borderTop: `4px solid ${theme["--slide-primary"]}`,
            }}
          >
            <span
              style={{
                fontSize: "48px",
                lineHeight: 1,
                fontWeight: 800,
                fontFamily: theme["--slide-font-display"],
                color: theme["--slide-primary-text"],
              }}
            >
              {step.label}
            </span>
            <h3 style={{ fontSize: "24px", fontWeight: 700, fontFamily: theme["--slide-font-display"], margin: 0 }}>{step.title}</h3>
            {step.channel && <ChannelPill theme={theme}>{step.channel}</ChannelPill>}
            <p style={{ fontSize: "17px", lineHeight: 1.5, color: theme["--slide-muted"], margin: 0 }}>{step.text}</p>
          </div>
        ))}
      </div>
    </Frame>
  );
}
