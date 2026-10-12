"use client";

import * as React from "react";
import { cardSurface } from "../style";
import { SlideIcon } from "../icons";
import { EditableItem, EditableText } from "../editable";
import { Frame, Lead, Title, pad, type LayoutProps } from "./parts";

interface ProblemContent {
  headline: string;
  intro?: string;
  painPoints: Array<{ icon?: string; title: string; text: string }>;
}

/** Numbered rows separated by rules: reads like a diagnosis, one pain at a time. */
export function ProblemList({ content, theme }: LayoutProps<ProblemContent>) {
  const { headline, intro, painPoints } = content;
  const danger = theme["--slide-danger"];
  return (
    <Frame theme={theme} style={{ justifyContent: "center", gap: "40px" }}>
      <header style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <Title theme={theme} size={56} color={danger} path="headline">{headline}</Title>
        <Lead theme={theme} path="intro" style={{ maxWidth: "1300px" }}>{intro}</Lead>
      </header>
      <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {painPoints.map((pain, i) => (
          <EditableItem as="li" path="painPoints" index={i} length={painPoints.length}
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "96px 1fr",
              alignItems: "baseline",
              gap: "24px",
              padding: "22px 0",
              borderTop: `1px solid ${danger}33`,
            }}
          >
            <span style={{ fontSize: "40px", fontWeight: 800, fontFamily: theme["--slide-font-display"], color: danger }}>
              {pad(i + 1)}
            </span>
            <div style={{ display: "flex", gap: "40px", alignItems: "baseline" }}>
              <EditableText
                as="h3"
                path={`painPoints.${i}.title`}
                value={pain.title}
                style={{ fontSize: "26px", fontWeight: 700, fontFamily: theme["--slide-font-display"], margin: 0, flex: "0 0 480px" }}
              />
              <EditableText
                as="p"
                path={`painPoints.${i}.text`}
                value={pain.text}
                multiline
                style={{ fontSize: "19px", lineHeight: 1.5, color: theme["--slide-muted"], margin: 0 }}
              />
            </div>
          </EditableItem>
        ))}
      </ol>
    </Frame>
  );
}

/** Headline column on the left, pains stacked as compact cards on the right. */
export function ProblemAside({ content, theme }: LayoutProps<ProblemContent>) {
  const { headline, intro, painPoints } = content;
  const danger = theme["--slide-danger"];
  return (
    <Frame theme={theme} style={{ flexDirection: "row", gap: "80px", alignItems: "center" }}>
      <div style={{ flex: "0 0 640px", display: "flex", flexDirection: "column", gap: "24px" }}>
        <div style={{ width: "72px", height: "6px", borderRadius: "9999px", background: danger }} />
        <Title theme={theme} size={60} color={danger} path="headline">{headline}</Title>
        <Lead theme={theme} path="intro">{intro}</Lead>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
        {painPoints.map((pain, i) => (
          <EditableItem path="painPoints" index={i} length={painPoints.length}
            key={i}
            style={{
              display: "flex",
              gap: "20px",
              alignItems: "flex-start",
              padding: "22px 26px",
              ...cardSurface(theme),
              borderRadius: theme["--slide-radius"],
              borderLeft: `4px solid ${danger}`,
            }}
          >
            <span style={{ color: danger, flexShrink: 0, marginTop: "2px" }}>
              <SlideIcon name={pain.icon} size={28} fallback="⚠" />
            </span>
            <div>
              <EditableText
                as="h3"
                path={`painPoints.${i}.title`}
                value={pain.title}
                style={{ fontSize: "22px", fontWeight: 700, fontFamily: theme["--slide-font-display"], margin: "0 0 6px" }}
              />
              <EditableText
                as="p"
                path={`painPoints.${i}.text`}
                value={pain.text}
                multiline
                style={{ fontSize: "17px", lineHeight: 1.5, color: theme["--slide-muted"], margin: 0 }}
              />
            </div>
          </EditableItem>
        ))}
      </div>
    </Frame>
  );
}
