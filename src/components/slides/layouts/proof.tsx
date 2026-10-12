"use client";

import * as React from "react";
import { cardSurface } from "../style";
import { EditableText, useSlideEditing } from "../editable";
import { Frame, Title, type LayoutProps } from "./parts";

interface ProofContent {
  headline: string;
  items: Array<{ quote?: string; name: string; role?: string; result?: string }>;
}

/** One testimonial in the spotlight (its quote, or its result); the rest as chips below. */
export function ProofQuote({ content, theme }: LayoutProps<ProofContent>) {
  const { headline, items } = content;
  const editing = useSlideEditing();
  const spotlightAt = Math.max(0, items.findIndex((item) => item.quote));
  const spotlight = items[spotlightAt];
  const others = items.filter((_, i) => i !== spotlightAt);
  // The field the spotlight shows (same fallback order as its text): quote, else result, else name.
  const spotlightField = spotlight.quote != null ? "quote" : spotlight.result != null ? "result" : "name";
  const success = theme["--slide-success"];
  return (
    <Frame theme={theme} style={{ justifyContent: "space-between", alignItems: "center", textAlign: "center" }}>
      <EditableText
        as="p"
        path="headline"
        value={headline}
        style={{ fontSize: "22px", fontWeight: 600, color: theme["--slide-muted"], margin: 0 }}
      />
      <figure style={{ margin: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: "36px", maxWidth: "1450px" }}>
        <span aria-hidden="true" style={{ fontSize: "160px", lineHeight: 0.5, color: theme["--slide-primary"], fontFamily: "Georgia, serif" }}>
          “
        </span>
        <blockquote style={{ margin: 0 }}>
          <Title
            theme={theme}
            size={spotlight.quote ? 52 : 96}
            align="center"
            color={spotlight.quote ? undefined : success}
            path={`items.${spotlightAt}.${spotlightField}`}
          >
            {spotlight.quote ?? spotlight.result ?? spotlight.name}
          </Title>
        </blockquote>
        <figcaption style={{ fontSize: "22px" }}>
          <EditableText as="strong" path={`items.${spotlightAt}.name`} value={spotlight.name} />
          {(spotlight.role || editing) && (
            <span style={{ color: theme["--slide-muted"] }}>
              {" "}
              · <EditableText path={`items.${spotlightAt}.role`} value={spotlight.role} />
            </span>
          )}
          {spotlight.quote && (spotlight.result || editing) && (
            <span style={{ color: success, fontWeight: 700 }}>
              {" "}
              · <EditableText path={`items.${spotlightAt}.result`} value={spotlight.result} />
            </span>
          )}
        </figcaption>
      </figure>
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center", minHeight: "56px" }}>
        {others.map((item, i) => {
          // `others` skips the spotlight: map back to the item's index in `items`.
          const at = i < spotlightAt ? i : i + 1;
          return (
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
              <EditableText as="strong" path={`items.${at}.name`} value={item.name} />
              <EditableText path={`items.${at}.result`} value={item.result} style={{ color: success, fontWeight: 700 }} />
            </span>
          );
        })}
      </div>
    </Frame>
  );
}

/** Results as a ruled table: who, context, outcome (right-aligned, success colour). */
export function ProofTable({ content, theme }: LayoutProps<ProofContent>) {
  const { headline, items } = content;
  const editing = useSlideEditing();
  const success = theme["--slide-success"];
  return (
    <Frame theme={theme} style={{ justifyContent: "center", gap: "48px" }}>
      <Title theme={theme} size={52} color={theme["--slide-primary-text"]} path="headline">{headline}</Title>
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
                <EditableText path={`items.${i}.name`} value={item.name} />
                {(item.role || editing) && (
                  <span style={{ fontSize: "18px", fontWeight: 400, color: theme["--slide-muted"] }}>
                    {" "}
                    · <EditableText path={`items.${i}.role`} value={item.role} />
                  </span>
                )}
              </span>
              {(item.quote || editing) && (
                <span style={{ fontSize: "18px", fontStyle: "italic", color: theme["--slide-muted"], maxWidth: "1100px" }}>
                  « <EditableText path={`items.${i}.quote`} value={item.quote} multiline /> »
                </span>
              )}
            </div>
            <EditableText
              path={`items.${i}.result`}
              value={item.result}
              style={{ fontSize: "32px", fontWeight: 800, fontFamily: theme["--slide-font-display"], color: success, textAlign: "right" }}
            />
          </div>
        ))}
      </div>
    </Frame>
  );
}
