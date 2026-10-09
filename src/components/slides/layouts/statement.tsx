"use client";

import * as React from "react";
import { kickerStyle } from "../style";
import { Frame, Lead, Title, type LayoutProps } from "./parts";

interface StatementContent {
  eyebrow?: string;
  headline: string;
  highlight?: string;
  sub?: string;
}

/** Headline with the highlight coloured in place (or appended), as in the original. */
function Highlighted({ headline, highlight, color }: { headline: string; highlight?: string; color: string }) {
  if (!highlight) return <>{headline}</>;
  const at = headline.indexOf(highlight);
  if (at < 0) {
    return (
      <>
        {headline} <span style={{ color }}>{highlight}</span>
      </>
    );
  }
  return (
    <>
      {headline.slice(0, at)}
      <span style={{ color }}>{highlight}</span>
      {headline.slice(at + highlight.length)}
    </>
  );
}

/** Left-aligned manifesto with an accent bar. */
export function StatementLeft({ content, theme }: LayoutProps<StatementContent>) {
  const { eyebrow, headline, highlight, sub } = content;
  return (
    <Frame theme={theme} style={{ justifyContent: "center", paddingLeft: "160px" }}>
      <div style={{ display: "flex", gap: "48px" }}>
        <div style={{ width: "10px", borderRadius: "9999px", background: theme["--slide-primary"], flexShrink: 0 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          {eyebrow && <p style={{ ...kickerStyle(theme), alignSelf: "flex-start", margin: 0 }}>{eyebrow}</p>}
          <Title theme={theme} size={72} maxWidth="1400px">
            <Highlighted headline={headline} highlight={highlight} color={theme["--slide-primary-text"]} />
          </Title>
          {sub && <Lead theme={theme} style={{ fontSize: "26px", maxWidth: "1100px" }}>{sub}</Lead>}
        </div>
      </div>
    </Frame>
  );
}

/** The highlight becomes the hero word; the headline sits above it as context. */
export function StatementBanner({ content, theme }: LayoutProps<StatementContent>) {
  const { eyebrow, headline, highlight, sub } = content;
  // Without a separate highlight there is no hero word: the headline takes its place.
  const hero = highlight ?? headline;
  const context = highlight ? headline.replace(highlight, "").replace(/\s{2,}/g, " ").trim() : undefined;
  return (
    <Frame theme={theme} style={{ justifyContent: "center", alignItems: "center", textAlign: "center", gap: "32px" }}>
      {eyebrow && <p style={{ ...kickerStyle(theme), margin: 0 }}>{eyebrow}</p>}
      {context && (
        <p style={{ fontSize: "36px", fontWeight: 600, fontFamily: theme["--slide-font-display"], margin: 0, maxWidth: "1400px" }}>
          {context}
        </p>
      )}
      <Title theme={theme} size={highlight ? 136 : 88} align="center" color={theme["--slide-primary-text"]} maxWidth="1600px">
        {hero}
      </Title>
      {sub && <Lead theme={theme} style={{ fontSize: "24px", maxWidth: "1000px" }}>{sub}</Lead>}
    </Frame>
  );
}
