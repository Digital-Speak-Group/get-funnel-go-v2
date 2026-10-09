"use client";

import * as React from "react";
import { Frame, Lead, Title } from "../layouts/parts";

interface BlanksContent {
  headline: string;
  intro?: string;
  fields: Array<{ label: string; prefix?: string; suffix?: string; hint?: string }>;
  summary?: string;
}

/**
 * Personalised figures filled live: the presenter types the prospect's numbers in the
 * presenter view and they appear here (and on the audience screen). Empty blanks show a line.
 */
export function BlanksSlide({
  content,
  theme,
  liveValues,
}: {
  content: BlanksContent;
  theme: Record<string, string>;
  liveValues?: string[];
}) {
  const { headline, intro, fields, summary } = content;
  return (
    <Frame theme={theme} style={{ justifyContent: "center", gap: "48px" }}>
      <header style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <Title theme={theme} size={56}>{headline}</Title>
        {intro && <Lead theme={theme} style={{ maxWidth: "1300px" }}>{intro}</Lead>}
      </header>
      <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "1fr auto", columnGap: "48px" }}>
        {fields.map((field, i) => {
          const value = liveValues?.[i]?.trim();
          return (
            <React.Fragment key={i}>
              <dt
                style={{
                  fontSize: "28px",
                  fontWeight: 600,
                  padding: "22px 0",
                  borderTop: `1px solid ${theme["--slide-muted"]}33`,
                }}
              >
                {field.label}
              </dt>
              <dd
                data-blank-filled={value ? "true" : "false"}
                style={{
                  margin: 0,
                  padding: "22px 0",
                  borderTop: `1px solid ${theme["--slide-muted"]}33`,
                  textAlign: "right",
                  fontSize: "40px",
                  fontWeight: 800,
                  fontFamily: theme["--slide-font-display"],
                  color: value ? theme["--slide-primary-text"] : theme["--slide-muted"],
                  minWidth: "320px",
                }}
              >
                {field.prefix && <span style={{ marginRight: "8px" }}>{field.prefix}</span>}
                {value ? (
                  value
                ) : (
                  <span
                    aria-label={field.hint ?? "à compléter"}
                    style={{ display: "inline-block", width: "200px", borderBottom: `4px solid ${theme["--slide-muted"]}66` }}
                  >
                    &nbsp;
                  </span>
                )}
                {field.suffix && <span style={{ marginLeft: "8px", fontSize: "28px" }}>{field.suffix}</span>}
              </dd>
            </React.Fragment>
          );
        })}
      </dl>
      {summary && (
        <p style={{ margin: 0, fontSize: "24px", fontWeight: 600, color: theme["--slide-primary-text"] }}>{summary}</p>
      )}
    </Frame>
  );
}
