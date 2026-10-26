"use client";

import * as React from "react";
import { EMBED_SANDBOX, isAllowedEmbedUrl } from "@/lib/slides/embed";
import { useStaticSlide } from "../render-context";

type Theme = Record<string, string>;

/**
 * A browser window drawn with theme colours: three dots, an address bar, then the page. With
 * `href` (an allow-listed page, live slides only) the address opens the page in a new tab —
 * the way out for sites that refuse to be framed.
 */
export function BrowserFrame({
  theme,
  address,
  href,
  children,
  style,
}: {
  theme: Theme;
  address: string;
  href?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const isStatic = useStaticSlide();
  const link = href && !isStatic && isAllowedEmbedUrl(href) ? href : undefined;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        borderRadius: theme["--slide-radius"],
        overflow: "hidden",
        border: `1px solid ${theme["--slide-muted"]}40`,
        background: theme["--slide-surface"],
        boxShadow: `0 32px 80px -40px ${theme["--slide-primary"]}99`,
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          padding: "14px 20px",
          borderBottom: `1px solid ${theme["--slide-muted"]}33`,
        }}
      >
        <div style={{ display: "flex", gap: "8px" }} aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span key={i} style={{ width: "12px", height: "12px", borderRadius: "9999px", background: `${theme["--slide-muted"]}66` }} />
          ))}
        </div>
        <a
          href={link}
          target={link ? "_blank" : undefined}
          rel={link ? "noopener noreferrer" : undefined}
          style={{
            flex: 1,
            textDecoration: "none",
            cursor: link ? "pointer" : "default",
            padding: "6px 16px",
            borderRadius: "9999px",
            background: theme["--slide-bg"],
            color: theme["--slide-muted"],
            fontSize: "15px",
            fontFamily: theme["--slide-font-body"],
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {address}
          {link && <span aria-hidden="true"> ↗</span>}
        </a>
      </div>
      <div style={{ position: "relative", flex: 1, minHeight: 0 }}>{children}</div>
    </div>
  );
}

/** Host shown in the address bar, or a neutral hint when there is no URL yet. */
export function displayAddress(url: string | undefined): string {
  if (!url) return "Ajoutez l'adresse de la page";
  try {
    const parsed = new URL(url);
    return parsed.host + (parsed.pathname === "/" ? "" : parsed.pathname);
  } catch {
    return url;
  }
}

/**
 * The live page in a sandboxed iframe — only for allow-listed https URLs and only when the
 * slide is shown live. Thumbnails, missing or refused URLs get a still placeholder.
 */
export function EmbeddedPage({ url, title, theme }: { url?: string; title: string; theme: Theme }) {
  const isStatic = useStaticSlide();
  const allowed = url !== undefined && isAllowedEmbedUrl(url);

  if (!allowed || isStatic) {
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          color: theme["--slide-muted"],
          background: `repeating-linear-gradient(135deg, transparent 0 22px, ${theme["--slide-muted"]}0f 22px 44px)`,
          textAlign: "center",
          padding: "32px",
        }}
      >
        <span style={{ fontSize: "28px", fontWeight: 700, color: theme["--slide-text"], fontFamily: theme["--slide-font-display"] }}>
          {title}
        </span>
        <span style={{ fontSize: "18px" }}>
          {!url ? "Page à ajouter" : !allowed ? "Domaine non autorisé" : "Aperçu en direct pendant la présentation"}
        </span>
      </div>
    );
  }
  return (
    <iframe
      src={url}
      title={title}
      sandbox={EMBED_SANDBOX}
      referrerPolicy="no-referrer"
      loading="lazy"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0, background: "#fff" }}
    />
  );
}
