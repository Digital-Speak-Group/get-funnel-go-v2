"use client";

import * as React from "react";
import { cardSurface } from "../style";
import { Frame, Title, type LayoutProps } from "./parts";

interface KpiContent {
  headline: string;
  metrics: Array<{ value: string; label: string; delta?: string }>;
}

function Delta({ theme, children }: { theme: Record<string, string>; children: React.ReactNode }) {
  return (
    <span
      style={{
        alignSelf: "flex-start",
        fontSize: "16px",
        fontWeight: 700,
        padding: "4px 12px",
        borderRadius: "9999px",
        background: `${theme["--slide-success"]}26`,
        color: theme["--slide-success"],
      }}
    >
      {children}
    </span>
  );
}

/** Values are free text ("+68%", "CTR annonce → page"): long ones get a smaller size. */
function valueSize(value: string, sizes: [number, number, number]): number {
  return value.length <= 7 ? sizes[0] : value.length <= 12 ? sizes[1] : sizes[2];
}

/** One card per metric, value in the primary colour. */
export function KpiCards({ content, theme }: LayoutProps<KpiContent>) {
  const { headline, metrics } = content;
  return (
    <Frame theme={theme} style={{ justifyContent: "center", gap: "64px" }}>
      <Title theme={theme} size={52} align="center" color={theme["--slide-primary-text"]}>{headline}</Title>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${metrics.length}, 1fr)`, gap: "28px" }}>
        {metrics.map((metric, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              padding: "44px 40px",
              ...cardSurface(theme),
              borderRadius: theme["--slide-radius"],
              border: `1px solid ${theme["--slide-primary"]}33`,
            }}
          >
            <span
              style={{
                fontSize: `${valueSize(metric.value, [76, 56, 40])}px`,
                lineHeight: 1.05,
                fontWeight: 800,
                fontFamily: theme["--slide-font-display"],
                color: theme["--slide-primary-text"],
              }}
            >
              {metric.value}
            </span>
            <span style={{ fontSize: "22px", fontWeight: 500, color: theme["--slide-muted"] }}>{metric.label}</span>
            {metric.delta && <Delta theme={theme}>{metric.delta}</Delta>}
          </div>
        ))}
      </div>
    </Frame>
  );
}

/** The first metric as the hero number; the others stacked beside it. */
export function KpiHero({ content, theme }: LayoutProps<KpiContent>) {
  const { headline, metrics } = content;
  const [hero, ...rest] = metrics;
  return (
    <Frame theme={theme} style={{ gap: "48px" }}>
      <Title theme={theme} size={48}>{headline}</Title>
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "96px" }}>
        <div style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", gap: "20px", maxWidth: "1000px" }}>
          <span
            style={{
              fontSize: `${valueSize(hero.value, [200, 128, 88])}px`,
              lineHeight: 0.95,
              fontWeight: 800,
              fontFamily: theme["--slide-font-display"],
              color: theme["--slide-primary-text"],
              letterSpacing: "-0.03em",
            }}
          >
            {hero.value}
          </span>
          <span style={{ fontSize: "30px", fontWeight: 600 }}>{hero.label}</span>
          {hero.delta && <Delta theme={theme}>{hero.delta}</Delta>}
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "32px", borderLeft: `2px solid ${theme["--slide-primary"]}33`, paddingLeft: "64px" }}>
          {rest.map((metric, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: `${valueSize(metric.value, [56, 44, 34])}px`, lineHeight: 1.05, fontWeight: 800, fontFamily: theme["--slide-font-display"] }}>
                {metric.value}
              </span>
              <span style={{ fontSize: "20px", color: theme["--slide-muted"] }}>{metric.label}</span>
              {metric.delta && <Delta theme={theme}>{metric.delta}</Delta>}
            </div>
          ))}
        </div>
      </div>
    </Frame>
  );
}
