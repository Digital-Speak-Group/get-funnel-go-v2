"use client";

import * as React from "react";
import { cardSurface, headlineFill } from "../style";
import { useAssetUrl } from "../asset-url";
import { EditableItem, EditableText } from "../editable";

/** The image when the asset resolves; the placeholder when there is none or it fails to load. */
function GalleryImage({ assetId, alt }: { assetId?: string; alt: string }) {
  const assetUrl = useAssetUrl();
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => setFailed(false), [assetId]);

  if (assetId && !failed) {
    return (
      // Plain <img>: slides render at a fixed 1920×1080 and are CSS-scaled (also in the PDF
      // export), so next/image's responsive sizing doesn't apply.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={assetUrl(assetId)}
        alt={alt}
        onError={() => setFailed(true)}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }}
      />
    );
  }
  return (
    <div style={{ textAlign: "center" }} aria-hidden="true">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1}>
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="8.5" cy="8.5" r="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="21 15 16 10 5 21" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

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
          gridTemplateColumns: `repeat(auto-fit, minmax(280px, 1fr))`,
          gap: "20px",
          flex: 1,
          alignContent: "center",
        }}
      >
        {items.map((item, index) => (
          <EditableItem path="items" index={index} length={items.length}
            key={index}
            style={{
              display: "flex",
              flexDirection: "column",
              ...cardSurface(theme),
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
              <GalleryImage assetId={item.assetId} alt={item.caption} />
            </div>
            <EditableText
              as="div"
              path={`items.${index}.caption`}
              value={item.caption}
              style={{
                padding: "16px",
                fontSize: "15px",
                lineHeight: 1.5,
                color: theme["--slide-text"],
                fontWeight: 500,
              }}
            />
          </EditableItem>
        ))}
      </div>
    </div>
  );
}