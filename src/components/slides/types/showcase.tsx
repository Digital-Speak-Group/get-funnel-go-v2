"use client";

import * as React from "react";
import { Frame, Title } from "../layouts/parts";
import { BrowserFrame, EmbeddedPage, displayAddress } from "./browser-frame";

interface ShowcaseContent {
  headline: string;
  items: Array<{ title: string; url?: string }>;
}

/**
 * Several live pages browsed one at a time: titles on the left, the selected page in a browser
 * frame. Selection is local to each screen (the presenter clicks while talking; the audience
 * can browse on its own).
 */
export function ShowcaseSlide({ content, theme }: { content: ShowcaseContent; theme: Record<string, string> }) {
  const { headline, items } = content;
  const [selected, setSelected] = React.useState(0);
  const current = items[Math.min(selected, items.length - 1)];

  return (
    <Frame theme={theme} style={{ gap: "32px", padding: "72px 96px" }}>
      <Title theme={theme} size={44} color={theme["--slide-primary-text"]}>{headline}</Title>
      <div style={{ flex: 1, display: "flex", gap: "32px", minHeight: 0 }}>
        <ol style={{ listStyle: "none", margin: 0, padding: 0, flex: "0 0 380px", display: "flex", flexDirection: "column", gap: "10px", overflow: "hidden" }}>
          {items.map((item, i) => {
            const active = item === current;
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => setSelected(i)}
                  aria-pressed={active}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "16px 20px",
                    borderRadius: theme["--slide-radius"],
                    border: `1px solid ${active ? theme["--slide-primary"] : `${theme["--slide-muted"]}33`}`,
                    background: active ? `${theme["--slide-primary"]}26` : "transparent",
                    color: theme["--slide-text"],
                    fontSize: "20px",
                    fontWeight: active ? 700 : 500,
                    fontFamily: theme["--slide-font-display"],
                    cursor: "pointer",
                  }}
                >
                  <span style={{ color: theme["--slide-primary-text"], marginRight: "12px" }}>{String(i + 1).padStart(2, "0")}</span>
                  {item.title}
                </button>
              </li>
            );
          })}
        </ol>
        <BrowserFrame theme={theme} address={displayAddress(current.url)} href={current.url} style={{ flex: 1 }}>
          {/* Keyed so switching pages swaps the iframe instead of navigating the old one. */}
          <EmbeddedPage key={selected} url={current.url} title={current.title} theme={theme} />
        </BrowserFrame>
      </div>
    </Frame>
  );
}
