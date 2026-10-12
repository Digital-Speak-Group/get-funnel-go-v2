"use client";

import * as React from "react";
import { cardSurface } from "../style";
import { useAssetUrl } from "../asset-url";
import { useStaticSlide } from "../render-context";
import { Frame, Title } from "../layouts/parts";
import { EditableText } from "../editable";

interface ScreenshotsContent {
  headline: string;
  items: Array<{ caption: string; result?: string; assetId?: string }>;
}

type Theme = Record<string, string>;

function Shot({ assetId, alt, theme }: { assetId?: string; alt: string; theme: Theme }) {
  const assetUrl = useAssetUrl();
  const [failed, setFailed] = React.useState(false);
  if (!assetId || failed) {
    return (
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: theme["--slide-muted"],
          fontSize: "16px",
          background: `repeating-linear-gradient(135deg, transparent 0 18px, ${theme["--slide-muted"]}12 18px 36px)`,
        }}
      >
        Capture à ajouter
      </div>
    );
  }
  return (
    // Plain <img>: fixed-size slide canvas, same reason as gallery.tsx.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={assetUrl(assetId)}
      alt={alt}
      onError={() => setFailed(true)}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }}
    />
  );
}

/** Screenshot proof: a grid of captures; clicking one opens it full-size (live slides only). */
export function ScreenshotsSlide({ content, theme }: { content: ScreenshotsContent; theme: Theme }) {
  const { headline, items } = content;
  const isStatic = useStaticSlide();
  const [open, setOpen] = React.useState<number | null>(null);
  const columns = items.length <= 2 ? items.length : items.length <= 4 ? 2 : items.length <= 6 ? 3 : 4;
  const opened = open === null ? null : items[open];

  return (
    <Frame theme={theme} style={{ gap: "36px", padding: "72px 96px", position: "relative" }}>
      <Title theme={theme} size={44} align="center" color={theme["--slide-primary-text"]} path="headline">{headline}</Title>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gridAutoRows: "1fr",
          gap: "20px",
        }}
      >
        {items.map((item, i) => (
          <button
            key={i}
            type="button"
            disabled={isStatic || !item.assetId}
            onClick={() => setOpen(i)}
            style={{
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              padding: 0,
              textAlign: "left",
              color: theme["--slide-text"],
              ...cardSurface(theme),
              borderRadius: theme["--slide-radius"],
              border: `1px solid ${theme["--slide-success"]}33`,
              overflow: "hidden",
              cursor: !isStatic && item.assetId ? "zoom-in" : "default",
            }}
          >
            <span style={{ position: "relative", flex: 1, minHeight: 0, display: "block", background: theme["--slide-bg"] }}>
              <Shot assetId={item.assetId} alt={item.caption} theme={theme} />
            </span>
            <span style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "12px 16px", fontSize: "16px" }}>
              <EditableText path={`items.${i}.caption`} value={item.caption} style={{ fontWeight: 600 }} />
              <EditableText
                path={`items.${i}.result`}
                value={item.result}
                style={{ fontWeight: 800, color: theme["--slide-success"], whiteSpace: "nowrap" }}
              />
            </span>
          </button>
        ))}
      </div>

      {opened && (
        <div
          role="dialog"
          aria-label={opened.caption}
          onClick={() => setOpen(null)}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "24px",
            padding: "64px",
            background: `${theme["--slide-bg"]}f2`,
            cursor: "zoom-out",
          }}
        >
          <div style={{ position: "relative", width: "100%", flex: 1 }}>
            <Shot assetId={opened.assetId} alt={opened.caption} theme={theme} />
          </div>
          <p style={{ margin: 0, fontSize: "26px", fontWeight: 700 }}>
            {opened.caption}
            {opened.result && <span style={{ color: theme["--slide-success"] }}> · {opened.result}</span>}
          </p>
        </div>
      )}
    </Frame>
  );
}
