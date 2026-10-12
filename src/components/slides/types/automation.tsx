"use client";

import * as React from "react";
import { cardSurface, headlineFill } from "../style";
import { EditableItem, EditableText } from "../editable";

interface AutomationContent {
  headline: string;
  items: Array<{
    trigger: string;
    action: string;
    delay?: string;
  }>;
}

export function AutomationSlide({ content, theme }: { content: AutomationContent; theme: Record<string, string> }) {
  const { headline, items } = content;

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
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        {items.map((item, index) => (
          <EditableItem path="items" index={index} length={items.length}
            key={index}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "24px",
              padding: "24px",
              ...cardSurface(theme),
              borderRadius: theme["--slide-radius"],
              border: `1px solid ${theme["--slide-primary"]}26`,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                <span
                  style={{
                    fontSize: "24px",
                    width: "48px",
                    height: "48px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: theme["--slide-success"],
                    color: theme["--slide-primary-fg"],
                    borderRadius: "12px",
                    flexShrink: 0,
                  }}
                >
                  ⚡
                </span>
                <EditableText
                  as="h3"
                  path={`items.${index}.trigger`}
                  value={item.trigger}
                  style={{
                    fontSize: "20px",
                    fontWeight: 600,
                    fontFamily: theme["--slide-font-display"],
                    margin: 0,
                  }}
                />
                <EditableText
                  as="span"
                  path={`items.${index}.delay`}
                  value={item.delay}
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    padding: "2px 8px",
                    background: theme["--slide-warning"],
                    color: "#000",
                    borderRadius: "9999px",
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: "16px",
                  lineHeight: 1.55,
                  color: theme["--slide-muted"],
                }}
              >
                → <EditableText path={`items.${index}.action`} value={item.action} multiline />
              </div>
            </div>
            <div
              style={{
                width: "48px",
                height: "48px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                color: theme["--slide-primary-text"],
                flexShrink: 0,
              }}
            >
              →
            </div>
          </EditableItem>
        ))}
      </div>
    </div>
  );
}