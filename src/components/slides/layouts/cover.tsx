"use client";

import * as React from "react";
import { kickerStyle } from "../style";
import { Frame, Lead, Title, type LayoutProps } from "./parts";

interface CoverContent {
  kicker?: string;
  title: string;
  subtitle?: string;
  presenterName?: string;
}

/** Text column on the left, a theme-coloured panel carrying the presenter on the right. */
export function CoverSplit({ content, theme }: LayoutProps<CoverContent>) {
  const { kicker, title, subtitle, presenterName } = content;
  return (
    <Frame theme={theme} style={{ flexDirection: "row", gap: "72px", alignItems: "stretch" }}>
      <div style={{ flex: 3, display: "flex", flexDirection: "column", justifyContent: "center", gap: "28px" }}>
        {kicker && <p style={{ ...kickerStyle(theme), alignSelf: "flex-start", margin: 0 }}>{kicker}</p>}
        <Title theme={theme} size={80}>{title}</Title>
        {subtitle && <Lead theme={theme} style={{ fontSize: "26px", maxWidth: "880px" }}>{subtitle}</Lead>}
      </div>
      <div
        style={{
          flex: 2,
          borderRadius: theme["--slide-radius"],
          background: `linear-gradient(160deg, ${theme["--slide-primary"]}, ${theme["--slide-accent"]})`,
          display: "flex",
          alignItems: "flex-end",
          padding: "48px",
          color: theme["--slide-primary-fg"],
        }}
      >
        {presenterName && (
          <div>
            <p style={{ fontSize: "16px", textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.8, margin: "0 0 8px" }}>
              Présenté par
            </p>
            <p style={{ fontSize: "32px", fontWeight: 700, fontFamily: theme["--slide-font-display"], margin: 0 }}>
              {presenterName}
            </p>
          </div>
        )}
      </div>
    </Frame>
  );
}

/** Magazine cover: kicker over a rule at the top, oversized title anchored bottom-left. */
export function CoverEditorial({ content, theme }: LayoutProps<CoverContent>) {
  const { kicker, title, subtitle, presenterName } = content;
  return (
    <Frame theme={theme} style={{ justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        {kicker && <p style={{ ...kickerStyle(theme), margin: 0, whiteSpace: "nowrap" }}>{kicker}</p>}
        <div style={{ flex: 1, height: "2px", background: `${theme["--slide-primary"]}66` }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
        <Title theme={theme} size={104} maxWidth="1500px">{title}</Title>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "48px" }}>
          {subtitle ? <Lead theme={theme} style={{ fontSize: "26px", maxWidth: "1000px" }}>{subtitle}</Lead> : <span />}
          {presenterName && (
            <p style={{ fontSize: "20px", color: theme["--slide-muted"], margin: 0, whiteSpace: "nowrap" }}>
              Présenté par <strong style={{ color: theme["--slide-text"] }}>{presenterName}</strong>
            </p>
          )}
        </div>
      </div>
    </Frame>
  );
}
