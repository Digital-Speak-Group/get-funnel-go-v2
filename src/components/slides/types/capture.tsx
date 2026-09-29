"use client";

import * as React from "react";

interface CaptureContent {
  headline: string;
  fields: Array<{
    label: string;
    type: "text" | "email" | "phone" | "select";
  }>;
  ctaLabel: string;
}

export function CaptureSlide({ content, theme }: { content: CaptureContent; theme: Record<string, string> }) {
  const { headline, fields, ctaLabel } = content;

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
        fontFamily: theme["--slide-font-body"],
        color: theme["--slide-text"],
      }}
    >
      <header style={{ marginBottom: "48px", maxWidth: "700px" }}>
        <h1
          style={{
            fontSize: "48px",
            lineHeight: 1.15,
            fontWeight: 700,
            fontFamily: theme["--slide-font-display"],
            marginBottom: "16px",
            color: theme["--slide-primary"],
          }}
        >
          {headline}
        </h1>
      </header>

      <form
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          width: "100%",
          maxWidth: "500px",
        }}
      >
        {fields.map((field, index) => (
          <div key={index} style={{ textAlign: "left" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 600,
                marginBottom: "8px",
                color: theme["--slide-text"],
              }}
            >
              {field.label}
            </label>
            {field.type === "select" ? (
              <select
                style={{
                  width: "100%",
                  padding: "16px",
                  fontSize: "16px",
                  background: theme["--slide-surface"],
                  color: theme["--slide-text"],
                  border: `1px solid ${theme["--slide-muted"]}33`,
                  borderRadius: theme["--slide-radius"],
                  fontFamily: theme["--slide-font-body"],
                }}
              >
                <option value="" disabled>
                  Sélectionnez...
                </option>
                <option>Option 1</option>
                <option>Option 2</option>
                <option>Option 3</option>
              </select>
            ) : (
              <input
                type={field.type}
                style={{
                  width: "100%",
                  padding: "16px",
                  fontSize: "16px",
                  background: theme["--slide-surface"],
                  color: theme["--slide-text"],
                  border: `1px solid ${theme["--slide-muted"]}33`,
                  borderRadius: theme["--slide-radius"],
                  fontFamily: theme["--slide-font-body"],
                }}
                placeholder={field.label}
              />
            )}
          </div>
        ))}
        <button
          type="submit"
          style={{
            marginTop: "8px",
            padding: "18px 32px",
            fontSize: "16px",
            fontWeight: 600,
            fontFamily: theme["--slide-font-display"],
            color: theme["--slide-primary-fg"],
            background: theme["--slide-primary"],
            border: "none",
            borderRadius: theme["--slide-radius"],
            cursor: "pointer",
            transition: "background 200ms ease",
          }}
        >
          {ctaLabel}
        </button>
      </form>
    </div>
  );
}