"use client";

import * as React from "react";
import { kickerStyle } from "../style";
import { Frame, Lead, Title } from "../layouts/parts";
import { BrowserFrame } from "./browser-frame";

type PageKind = "optin" | "sales" | "checkout" | "registration" | "thankyou";

interface MockupContent {
  headline: string;
  page: PageKind;
  blocks: Array<{ label: string; detail?: string }>;
  cta?: string;
  aside?: string;
}

const PAGE_LABELS: Record<PageKind, { name: string; path: string }> = {
  optin: { name: "Page d'opt-in", path: "votre-site.com/inscription-gratuite" },
  sales: { name: "Page de vente", path: "votre-site.com/offre" },
  checkout: { name: "Page de paiement", path: "votre-site.com/paiement" },
  registration: { name: "Page d'inscription", path: "votre-site.com/webinaire" },
  thankyou: { name: "Page de remerciement", path: "votre-site.com/merci" },
};

/** Wireframe of a funnel page: what sits on it, top to bottom, and the button that converts. */
export function MockupSlide({ content, theme }: { content: MockupContent; theme: Record<string, string> }) {
  const { headline, page, blocks, cta, aside } = content;
  const kind = PAGE_LABELS[page];
  return (
    <Frame theme={theme} style={{ flexDirection: "row", gap: "72px", alignItems: "center" }}>
      <div style={{ flex: "0 0 560px", display: "flex", flexDirection: "column", gap: "24px" }}>
        <p style={{ ...kickerStyle(theme), alignSelf: "flex-start", margin: 0 }}>{kind.name}</p>
        <Title theme={theme} size={52}>{headline}</Title>
        {aside && <Lead theme={theme}>{aside}</Lead>}
      </div>
      <BrowserFrame theme={theme} address={kind.path} style={{ flex: 1, alignSelf: "stretch" }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", gap: "14px", padding: "28px 40px" }}>
          {blocks.map((block, i) => (
            <div
              key={i}
              style={{
                flex: i === 0 ? 1.4 : 1,
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: "4px",
                padding: "12px 20px",
                borderRadius: "10px",
                border: `2px dashed ${theme["--slide-muted"]}55`,
                background: i === 0 ? `${theme["--slide-primary"]}14` : "transparent",
              }}
            >
              <span style={{ fontSize: i === 0 ? "24px" : "19px", fontWeight: 700, fontFamily: theme["--slide-font-display"] }}>
                {block.label}
              </span>
              {block.detail && <span style={{ fontSize: "15px", color: theme["--slide-muted"] }}>{block.detail}</span>}
            </div>
          ))}
          {cta && (
            <div
              style={{
                alignSelf: "center",
                padding: "16px 48px",
                borderRadius: theme["--slide-radius"],
                background: theme["--slide-primary"],
                color: theme["--slide-primary-fg"],
                fontSize: "20px",
                fontWeight: 700,
                fontFamily: theme["--slide-font-display"],
              }}
            >
              {cta}
            </div>
          )}
        </div>
      </BrowserFrame>
    </Frame>
  );
}
