"use client";

import * as React from "react";
import { Frame, Lead, Title } from "../layouts/parts";
import { BrowserFrame, EmbeddedPage, displayAddress } from "./browser-frame";

interface EmbedContent {
  headline: string;
  title: string;
  url?: string;
  caption?: string;
}

/** One live page (a Funnelytics map, a client funnel) inside a browser frame. */
export function EmbedSlide({ content, theme }: { content: EmbedContent; theme: Record<string, string> }) {
  const { headline, title, url, caption } = content;
  return (
    <Frame theme={theme} style={{ gap: "32px", padding: "72px 96px" }}>
      <header style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "48px" }}>
        <Title theme={theme} size={44} color={theme["--slide-primary-text"]}>{headline}</Title>
        {caption && <Lead theme={theme} style={{ fontSize: "20px", maxWidth: "720px", textAlign: "right" }}>{caption}</Lead>}
      </header>
      <BrowserFrame theme={theme} address={displayAddress(url)} href={url} style={{ flex: 1 }}>
        <EmbeddedPage url={url} title={title} theme={theme} />
      </BrowserFrame>
    </Frame>
  );
}
