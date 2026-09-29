"use client";

import * as React from "react";

interface GalleryContent {
  headline: string;
  items: Array<{
    caption: string;
    assetId?: string;
  }>;
}

export function GallerySlide({ content, theme }: { content: GalleryContent; theme: Record<string, string> }) {
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
          display: "grid",
          gridTemplateColumns: `repeat(auto-fit, minmax(280px, 1fr))`,
          gap: "20px",
          flex: 1,
        }}
      >
        {items.map((item, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              flexDirection: "column",
              background: theme["--slide-surface"],
              borderRadius: theme["--slide-radius"],
              border: `1px solid ${theme["--slide-muted"]}1a`,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                aspectRatio: "16 / 9",
                background: theme["--slide-bg"],
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: theme["--slide-muted"],
                fontSize: "14px",
                position: "relative",
              }}
            >
              {item.assetId && (
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    padding: "4px 8px",
                    background: "rgba(0,0,0,0.6)",
                    color: theme["--slide-primary-fg"],
                    borderRadius: "4px",
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                  }}
                >
                  {item.assetId.slice(0, 8)}...
                </span>
              )}
              <div style={{ textAlign: "center" }}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1}>
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="8.5" cy="8.5" r="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points="21 15 16 10 5 21" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <div
              style={{
                padding: "16px",
                fontSize: "15px",
                lineHeight: 1.5,
                color: theme["--slide-text"],
                fontWeight: 500,
              }}
            >
              {item.caption}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}