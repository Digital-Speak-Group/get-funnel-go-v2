import { ImageResponse } from "next/og";
import { productTokens as t } from "@/lib/design/tokens";
import { marketingFacts as facts } from "./(marketing)/_lib/facts";
import { marketingMessages } from "./(marketing)/messages";

/*
 * Refined-dark OG card: near-black canvas, hairline, logo tile, one headline, verifiable facts.
 * Colors come from the product tokens (Satori cannot read CSS variables). No font is fetched:
 * the default bundled font renders, so the image never depends on the network at build time.
 */
const m = marketingMessages.og;

export const alt = m.alt;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          backgroundColor: t.bg,
          color: t.fg,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "56px",
              height: "56px",
              borderRadius: "12px",
              backgroundColor: t.primary,
              color: t["primary-fg"],
            }}
          >
            <svg width="34" height="34" viewBox="0 0 16 16" fill="currentColor">
              <rect x="1" y="2" width="14" height="3" rx="1.5" />
              <rect x="3.5" y="6.5" width="9" height="3" rx="1.5" opacity="0.85" />
              <rect x="6" y="11" width="4" height="3" rx="1.5" opacity="0.7" />
            </svg>
          </div>
          <span style={{ fontSize: "36px", fontWeight: 600, letterSpacing: "-0.02em" }}>GetFunnels</span>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: "72px",
            fontWeight: 600,
            lineHeight: 1.08,
            letterSpacing: "-0.035em",
            maxWidth: "960px",
          }}
        >
          {m.title}
        </div>

        <div
          style={{
            display: "flex",
            paddingTop: "28px",
            borderTop: `1px solid ${t["surface-3"]}`,
            fontSize: "28px",
            color: t["fg-muted"],
          }}
        >
          {m.facts(facts.frameworks, facts.slideTypes, facts.themes)}
        </div>
      </div>
    ),
    { ...size }
  );
}
