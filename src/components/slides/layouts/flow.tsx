"use client";

import * as React from "react";
import { cardSurface } from "../style";
import { EditableItem, EditableText } from "../editable";
import { Frame, Title, type LayoutProps } from "./parts";

interface FlowContent {
  headline: string;
  steps: Array<{ label: string; title: string; text: string; channel?: string }>;
}

/** Optional channel tag: renders nothing without a value (outside the editor). */
function ChannelPill({ theme, path, value }: { theme: Record<string, string>; path: string; value: string | undefined }) {
  return (
    <EditableText
      path={path}
      value={value}
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
    />
  );
}

/** Horizontal timeline: one column per step, joined by a line through numbered nodes; the step label sits under its node. */
export function FlowTimeline({ content, theme }: LayoutProps<FlowContent>) {
  const { headline, steps } = content;
  const primary = theme["--slide-primary"];
  return (
    <Frame theme={theme} style={{ justifyContent: "center", gap: "72px" }}>
      <Title theme={theme} size={52} align="center" color={theme["--slide-primary-text"]} path="headline">{headline}</Title>
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
          <EditableItem path="steps" index={i} length={steps.length} key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "16px" }}>
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
            <EditableText
              path={`steps.${i}.label`}
              value={step.label}
              style={{
                fontSize: "14px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: theme["--slide-primary-text"],
              }}
            />
            <EditableText
              as="h3"
              path={`steps.${i}.title`}
              value={step.title}
              style={{ fontSize: "22px", fontWeight: 700, fontFamily: theme["--slide-font-display"], margin: 0 }}
            />
            <ChannelPill theme={theme} path={`steps.${i}.channel`} value={step.channel} />
            <EditableText
              as="p"
              path={`steps.${i}.text`}
              value={step.text}
              multiline
              style={{ fontSize: "16px", lineHeight: 1.5, color: theme["--slide-muted"], margin: 0 }}
            />
          </EditableItem>
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
      <Title theme={theme} size={52} color={theme["--slide-primary-text"]} path="headline">{headline}</Title>
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
          <EditableItem path="steps" index={i} length={steps.length}
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
            <EditableText
              path={`steps.${i}.label`}
              value={step.label}
              style={{
                fontSize: "48px",
                lineHeight: 1,
                fontWeight: 800,
                fontFamily: theme["--slide-font-display"],
                color: theme["--slide-primary-text"],
              }}
            />
            <EditableText
              as="h3"
              path={`steps.${i}.title`}
              value={step.title}
              style={{ fontSize: "24px", fontWeight: 700, fontFamily: theme["--slide-font-display"], margin: 0 }}
            />
            <ChannelPill theme={theme} path={`steps.${i}.channel`} value={step.channel} />
            <EditableText
              as="p"
              path={`steps.${i}.text`}
              value={step.text}
              multiline
              style={{ fontSize: "17px", lineHeight: 1.5, color: theme["--slide-muted"], margin: 0 }}
            />
          </EditableItem>
        ))}
      </div>
    </Frame>
  );
}
