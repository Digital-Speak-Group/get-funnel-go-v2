"use client";

import * as React from "react";
import { cardSurface, headlineFill } from "../style";
import { EditableItem, EditableText } from "../editable";

interface ObjectivesContent {
  headline: string;
  goals: Array<{
    label: string;
    target: string;
    text: string;
  }>;
}

export function ObjectivesSlide({ content, theme }: { content: ObjectivesContent; theme: Record<string, string> }) {
  const { headline, goals } = content;

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
        {goals.map((goal, index) => (
          <EditableItem path="goals" index={index} length={goals.length}
            key={index}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              padding: "28px",
              ...cardSurface(theme),
              borderRadius: theme["--slide-radius"],
              border: `1px solid ${theme["--slide-primary"]}26`,
              position: "relative",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
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
                {index + 1}
              </div>
              <div>
                <EditableText
                  as="h3"
                  path={`goals.${index}.label`}
                  value={goal.label}
                  style={{
                    fontSize: "22px",
                    fontWeight: 600,
                    fontFamily: theme["--slide-font-display"],
                    margin: "0 0 4px 0",
                  }}
                />
                <EditableText
                  as="p"
                  path={`goals.${index}.target`}
                  value={goal.target}
                  style={{
                    fontSize: "16px",
                    fontWeight: 500,
                    color: theme["--slide-primary-text"],
                    margin: 0,
                  }}
                />
              </div>
            </div>
            <EditableText
              as="p"
              path={`goals.${index}.text`}
              value={goal.text}
              multiline
              style={{
                fontSize: "16px",
                lineHeight: 1.55,
                color: theme["--slide-text"],
                margin: 0,
              }}
            />
          </EditableItem>
        ))}
      </div>
    </div>
  );
}