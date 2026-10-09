"use client";

import * as React from "react";
import { cardSurface } from "../style";
import { SlideIcon } from "../icons";
import { Frame, Title, type LayoutProps } from "./parts";

interface BenefitsContent {
  headline: string;
  benefits: Array<{ icon?: string; title: string; text: string }>;
}

/** Two-column checklist without cards: lighter, for decks heavy on boxes. */
export function BenefitsChecklist({ content, theme }: LayoutProps<BenefitsContent>) {
  const { headline, benefits } = content;
  const success = theme["--slide-success"];
  return (
    <Frame theme={theme} style={{ justifyContent: "center", gap: "56px" }}>
      <Title theme={theme} size={56} align="center" color={success}>{headline}</Title>
      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          columnGap: "80px",
          rowGap: "40px",
        }}
      >
        {benefits.map((benefit, i) => (
          <li key={i} style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
            <span
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "9999px",
                border: `2px solid ${success}`,
                color: success,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <SlideIcon name={benefit.icon} size={22} fallback="✓" />
            </span>
            <div>
              <h3 style={{ fontSize: "24px", fontWeight: 700, fontFamily: theme["--slide-font-display"], margin: "4px 0 8px" }}>
                {benefit.title}
              </h3>
              <p style={{ fontSize: "18px", lineHeight: 1.5, color: theme["--slide-muted"], margin: 0 }}>{benefit.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </Frame>
  );
}

/** The first benefit as a large featured card, the others listed beside it. */
export function BenefitsFeatured({ content, theme }: LayoutProps<BenefitsContent>) {
  const { headline, benefits } = content;
  const [first, ...rest] = benefits;
  const success = theme["--slide-success"];
  return (
    <Frame theme={theme} style={{ gap: "48px" }}>
      <Title theme={theme} size={52} color={success}>{headline}</Title>
      <div style={{ flex: 1, display: "flex", gap: "40px", minHeight: 0 }}>
        <div
          style={{
            flex: "0 0 760px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            gap: "20px",
            padding: "48px",
            borderRadius: theme["--slide-radius"],
            background: `linear-gradient(150deg, ${success}, ${theme["--slide-accent"]})`,
            color: theme["--slide-primary-fg"],
          }}
        >
          <SlideIcon name={first.icon} size={64} fallback="✓" />
          <h3 style={{ fontSize: "44px", lineHeight: 1.1, fontWeight: 800, fontFamily: theme["--slide-font-display"], margin: 0 }}>
            {first.title}
          </h3>
          <p style={{ fontSize: "22px", lineHeight: 1.45, margin: 0, opacity: 0.92 }}>{first.text}</p>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: "16px" }}>
          {rest.map((benefit, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: "18px",
                padding: "20px 24px",
                ...cardSurface(theme),
                borderRadius: theme["--slide-radius"],
                border: `1px solid ${success}26`,
              }}
            >
              <span style={{ color: success, flexShrink: 0 }}>
                <SlideIcon name={benefit.icon} size={26} fallback="✓" />
              </span>
              <div>
                <h3 style={{ fontSize: "21px", fontWeight: 700, fontFamily: theme["--slide-font-display"], margin: "0 0 6px" }}>
                  {benefit.title}
                </h3>
                <p style={{ fontSize: "16px", lineHeight: 1.5, color: theme["--slide-muted"], margin: 0 }}>{benefit.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Frame>
  );
}
