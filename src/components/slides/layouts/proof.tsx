"use client";

import * as React from "react";
import { cardSurface } from "../style";
import { Frame, Title, type LayoutProps } from "./parts";

interface ProofContent {
  headline: string;
  items: Array<{ quote?: string; name: string; role?: string; result?: string }>;
}

/** One testimonial in the spotlight (its quote, or its result); the rest as chips below. */
export function ProofQuote({ content, theme }: LayoutProps<ProofContent>) {
  const { headline, items } = content;
  const spotlightAt = Math.max(0, items.findIndex((item) => item.quote));
  const spotlight = items[spotlightAt];
  const others = items.filter((_, i) => i !== spotlightAt);
  const success = theme["--slide-success"];
  return (
    <Frame theme={theme} style={{ justifyContent: "space-between", alignItems: "center", textAlign: "center" }}>
      <p style={{ fontSize: "22px", fontWeight: 600, color: theme["--slide-muted"], margin: 0 }}>{headline}</p>
      <figure style={{ margin: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: "36px", maxWidth: "1450px" }}>
        <span aria-hidden="true" style={{ fontSize: "160px", lineHeight: 0.5, color: theme["--slide-primary"], fontFamily: "Georgia, serif" }}>
          “
        </span>
        <blockquote style={{ margin: 0 }}>
          <Title theme={theme} size={spotlight.quote ? 52 : 96} align="center" color={spotlight.quote ? undefined : success}>
            {spotlight.quote ?? spotlight.result ?? spotlight.name}
          </Title>
        </blockquote>
        <figcaption style={{ fontSize: "22px" }}>
          <strong>{spotlight.name}</strong>
          {spotlight.role && <span style={{ color: theme["--slide-muted"] }}> · {spotlight.role}</span>}
          {spotlight.quote && spotlight.result && (
            <span style={{ color: success, fontWeight: 700 }}> · {spotlight.result}</span>
          )}
        </figcaption>
      </figure>
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center", minHeight: "56px" }}>
        {others.map((item, i) => (
          <span
            key={i}
            style={{
              display: "inline-flex",
              gap: "10px",
              alignItems: "baseline",
              padding: "12px 22px",
              borderRadius: "9999px",
              ...cardSurface(theme),
              border: `1px solid ${success}33`,
              fontSize: "17px",
            }}
          >
            <strong>{item.name}</strong>
            {item.result && <span style={{ color: success, fontWeight: 700 }}>{item.result}</span>}
          </span>
        ))}
      </div>
    </Frame>
  );
}

/** Results as a ruled table: who, context, outcome (right-aligned, success colour). */
export function ProofTable({ content, theme }: LayoutProps<ProofContent>) {
  const { headline, items } = content;
  const success = theme["--slide-success"];
  return (
    <Frame theme={theme} style={{ justifyContent: "center", gap: "48px" }}>
      <Title theme={theme} size={52} color={theme["--slide-primary-text"]}>{headline}</Title>
      <div>
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              alignItems: "center",
              gap: "48px",
              padding: "28px 8px",
              borderTop: `1px solid ${theme["--slide-muted"]}40`,
              borderBottom: i === items.length - 1 ? `1px solid ${theme["--slide-muted"]}40` : undefined,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "26px", fontWeight: 700, fontFamily: theme["--slide-font-display"] }}>
                {item.name}
                {item.role && <span style={{ fontSize: "18px", fontWeight: 400, color: theme["--slide-muted"] }}> · {item.role}</span>}
              </span>
              {item.quote && (
                <span style={{ fontSize: "18px", fontStyle: "italic", color: theme["--slide-muted"], maxWidth: "1100px" }}>
                  « {item.quote} »
                </span>
              )}
            </div>
            {item.result && (
              <span style={{ fontSize: "32px", fontWeight: 800, fontFamily: theme["--slide-font-display"], color: success, textAlign: "right" }}>
                {item.result}
              </span>
            )}
          </div>
        ))}
      </div>
    </Frame>
  );
}
