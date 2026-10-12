"use client";

import * as React from "react";
import { cardSurface, headlineFill } from "../style";
import { EditableText } from "../editable";
import { SlideIcon } from "../icons";

interface WhyContent {
  headline: string;
  reasons: Array<{
    icon?: string;
    title: string;
    text: string;
  }>;
}

export function WhySlide({ content, theme }: { content: WhyContent; theme: Record<string, string> }) {
  const { headline, reasons } = content;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: "96px",
        fontFamily: theme["--slide-font-body"],
        color: theme["--slide-text"],
      }}
    >
      <header style={{ marginBottom: "48px", textAlign: "center" }}>
        <EditableText
          as="h1"
          path="headline"
          value={headline}
          style={{
            fontSize: "48px",
            lineHeight: 1.15,
            fontWeight: 700,
            fontFamily: theme["--slide-font-display"],
            marginBottom: "16px",
            ...headlineFill(theme, theme["--slide-primary-text"]),
          }}
        />
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "24px",
          flex: 1,
          alignContent: "center",
        }}
      >
        {reasons.map((reason, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              padding: "28px",
              ...cardSurface(theme),
              borderRadius: theme["--slide-radius"],
              border: `1px solid ${theme["--slide-primary"]}26`,
              transition: "transform 200ms ease, box-shadow 200ms ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
              <div
                style={{
                  fontSize: "24px",
                  width: "52px",
                  height: "52px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: theme["--slide-primary"],
                  color: theme["--slide-primary-fg"],
                  borderRadius: "13px",
                  flexShrink: 0,
                }}
              >
                <SlideIcon name={reason.icon} size={24} fallback={(index + 1).toString()} />
              </div>
              <div style={{ flex: 1 }}>
                <EditableText
                  as="h3"
                  path={`reasons.${index}.title`}
                  value={reason.title}
                  style={{
                    fontSize: "22px",
                    fontWeight: 600,
                    fontFamily: theme["--slide-font-display"],
                    margin: "0 0 8px 0",
                    color: theme["--slide-primary-text"],
                  }}
                />
                <EditableText
                  as="p"
                  path={`reasons.${index}.text`}
                  value={reason.text}
                  multiline
                  style={{
                    fontSize: "16px",
                    lineHeight: 1.55,
                    color: theme["--slide-text"],
                    margin: 0,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}