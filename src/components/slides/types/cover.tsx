"use client";

import * as React from "react";
import { headlineFill, kickerStyle } from "../style";
import { EditableText, useSlideEditing } from "../editable";

interface CoverContent {
  kicker?: string;
  title: string;
  subtitle?: string;
  presenterName?: string;
}

export function CoverSlide({ content, theme }: { content: CoverContent; theme: Record<string, string> }) {
  const { kicker, title, subtitle, presenterName } = content;
  const editing = useSlideEditing();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
        padding: "96px",
        textAlign: "center",
        fontFamily: theme["--slide-font-display"],
        color: theme["--slide-text"],
      }}
    >
      <EditableText as="p" path="kicker" value={kicker} style={{ ...kickerStyle(theme), marginBottom: "24px" }} />
      <EditableText
        as="h1"
        path="title"
        value={title}
        style={{
          ...headlineFill(theme, theme["--slide-text"]),
          fontSize: "72px",
          lineHeight: 1.05,
          fontWeight: 800,
          marginBottom: "24px",
          maxWidth: "1200px",
        }}
      />
      <EditableText
        as="p"
        path="subtitle"
        value={subtitle}
        multiline
        style={{
          fontSize: "24px",
          lineHeight: 1.35,
          fontWeight: 400,
          color: theme["--slide-muted"],
          maxWidth: "800px",
          marginBottom: "48px",
        }}
      />
      {(presenterName || editing) && (
        <p
          style={{
            fontSize: "18px",
            fontWeight: 400,
            color: theme["--slide-muted"],
          }}
        >
          Présenté par <EditableText path="presenterName" value={presenterName} />
        </p>
      )}
    </div>
  );
}