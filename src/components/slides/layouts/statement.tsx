"use client";

import * as React from "react";
import { kickerStyle } from "../style";
import { EditableText, useSlideEditing } from "../editable";
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
  const editing = useSlideEditing();
  return (
    <Frame theme={theme} style={{ justifyContent: "center", paddingLeft: "160px" }}>
      <div style={{ display: "flex", gap: "48px" }}>
        <div style={{ width: "10px", borderRadius: "9999px", background: theme["--slide-primary"], flexShrink: 0 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          <EditableText as="p" path="eyebrow" value={eyebrow} style={{ ...kickerStyle(theme), alignSelf: "flex-start", margin: 0 }} />
          {/* The highlight is a span inside the headline: while editing, the headline is one plain field. */}
          {editing ? (
            <Title theme={theme} size={72} maxWidth="1400px" path="headline">{headline}</Title>
          ) : (
            <Title theme={theme} size={72} maxWidth="1400px">
              <Highlighted headline={headline} highlight={highlight} color={theme["--slide-primary-text"]} />
            </Title>
          )}
          <Lead theme={theme} path="sub" style={{ fontSize: "26px", maxWidth: "1100px" }}>{sub}</Lead>
        </div>
      </div>
    </Frame>
  );
}

/** The highlight becomes the hero word; the headline sits above it as context. */
export function StatementBanner({ content, theme }: LayoutProps<StatementContent>) {
  const { eyebrow, headline, highlight, sub } = content;
  const editing = useSlideEditing();
  // Without a separate highlight there is no hero word: the headline takes its place.
  const hero = highlight ?? headline;
  const heroPath = highlight == null ? "headline" : "highlight";
  const context = highlight ? headline.replace(highlight, "").replace(/\s{2,}/g, " ").trim() : undefined;
  const contextStyle: React.CSSProperties = { fontSize: "36px", fontWeight: 600, fontFamily: theme["--slide-font-display"], margin: 0, maxWidth: "1400px" };
  return (
    <Frame theme={theme} style={{ justifyContent: "center", alignItems: "center", textAlign: "center", gap: "32px" }}>
      <EditableText as="p" path="eyebrow" value={eyebrow} style={{ ...kickerStyle(theme), margin: 0 }} />
      {/* The context is derived (headline minus highlight): while editing, the full headline is shown in its place. */}
      {editing && heroPath === "highlight" ? (
        <EditableText as="p" path="headline" value={headline} style={contextStyle} />
      ) : (
        context && <p style={contextStyle}>{context}</p>
      )}
      <Title theme={theme} size={highlight ? 136 : 88} align="center" color={theme["--slide-primary-text"]} maxWidth="1600px" path={heroPath}>
        {hero}
      </Title>
      <Lead theme={theme} path="sub" style={{ fontSize: "24px", maxWidth: "1000px" }}>{sub}</Lead>
    </Frame>
  );
}
