"use client";

import * as React from "react";

interface ComparisonContent {
  headline: string;
  columns: string[];
  rows: Array<{
    label: string;
    values: string[];
  }>;
}

export function ComparisonSlide({ content, theme }: { content: ComparisonContent; theme: Record<string, string> }) {
  const { headline, columns, rows } = content;

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

      <div
        style={{
          flex: 1,
          overflowX: "auto",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "16px",
            fontFamily: theme["--slide-font-body"],
          }}
        >
          <thead>
            <tr
              style={{
                background: theme["--slide-primary"],
                color: theme["--slide-primary-fg"],
              }}
            >
              <th
                style={{
                  padding: "16px 20px",
                  textAlign: "left",
                  fontWeight: 600,
                  fontFamily: theme["--slide-font-display"],
                }}
              >
                Critère
              </th>
              {columns.map((col, cIndex) => (
                <th
                  key={cIndex}
                  style={{
                    padding: "16px 20px",
                    textAlign: "center",
                    fontWeight: 600,
                    fontFamily: theme["--slide-font-display"],
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rIndex) => (
              <tr
                key={rIndex}
                style={{
                  background: rIndex % 2 === 0 ? theme["--slide-surface"] : theme["--slide-bg"],
                  borderBottom: `1px solid ${theme["--slide-muted"]}1a`,
                }}
              >
                <td
                  style={{
                    padding: "16px 20px",
                    fontWeight: 500,
                    fontFamily: theme["--slide-font-display"],
                  }}
                >
                  {row.label}
                </td>
                {row.values.map((val, vIndex) => (
                  <td
                    key={vIndex}
                    style={{
                      padding: "16px 20px",
                      textAlign: "center",
                    }}
                  >
                    {val}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}