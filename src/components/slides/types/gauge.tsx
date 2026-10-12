"use client";

import * as React from "react";
import { Frame, Title } from "../layouts/parts";
import { EditableItem, EditableText } from "../editable";

interface GaugeContent {
  headline: string;
  gauges: Array<{ label: string; value: number; max?: number; suffix?: string; note?: string }>;
}

type Theme = Record<string, string>;


const formatNumber = (n: number) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(n);

/** Up to 4 dials sit on one row; 5–8 wrap onto two rows of smaller dials. */
function Dial({
  gauge,
  index,
  length,
  theme,
  compact,
}: {
  gauge: GaugeContent["gauges"][0];
  /** Position in `gauges`, for the editable content paths. */
  index: number;
  /** `gauges.length`, for the item toolbar. */
  length: number;
  theme: Theme;
  compact: boolean;
}) {
  const RADIUS = compact ? 104 : 150;
  const STROKE = compact ? 20 : 26;
  const ARC = Math.PI * RADIUS; // length of the half circle
  const gradientId = React.useId();
  const max = gauge.max ?? 100;
  const ratio = Math.max(0, Math.min(1, gauge.value / max));
  const size = RADIUS * 2 + STROKE;
  const path = `M ${STROKE / 2} ${RADIUS + STROKE / 2} A ${RADIUS} ${RADIUS} 0 0 1 ${size - STROKE / 2} ${RADIUS + STROKE / 2}`;
  return (
    <EditableItem as="figure" path="gauges" index={index} length={length} style={{ margin: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
      <div style={{ position: "relative", width: `${size}px`, height: `${RADIUS + STROKE}px` }}>
        <svg width={size} height={RADIUS + STROKE} viewBox={`0 0 ${size} ${RADIUS + STROKE}`} aria-hidden="true">
          <defs>
            <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor={theme["--slide-primary"]} />
              <stop offset="100%" stopColor={theme["--slide-accent"]} />
            </linearGradient>
          </defs>
          <path d={path} fill="none" stroke={`${theme["--slide-muted"]}33`} strokeWidth={STROKE} strokeLinecap="round" />
          {ratio > 0 && (
            <path
              d={path}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={`${ARC * ratio} ${ARC}`}
            />
          )}
        </svg>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, textAlign: "center" }}>
          <span style={{ fontSize: compact ? "44px" : "64px", fontWeight: 800, lineHeight: 1, fontFamily: theme["--slide-font-display"] }}>
            {formatNumber(gauge.value)}
            {gauge.suffix && <span style={{ fontSize: compact ? "24px" : "32px", color: theme["--slide-muted"] }}>{gauge.suffix}</span>}
          </span>
        </div>
      </div>
      <figcaption style={{ textAlign: "center", maxWidth: `${size}px` }}>
        <EditableText
          path={`gauges.${index}.label`}
          value={gauge.label}
          style={{ display: "block", fontSize: compact ? "18px" : "22px", fontWeight: 700 }}
        />
        <EditableText
          path={`gauges.${index}.note`}
          value={gauge.note}
          style={{ display: "block", marginTop: "6px", fontSize: "16px", color: theme["--slide-muted"] }}
        />
      </figcaption>
    </EditableItem>
  );
}

/** KPI as dials: each value drawn against its maximum (100 when none is set). */
export function GaugeSlide({ content, theme }: { content: GaugeContent; theme: Theme }) {
  const { headline, gauges } = content;
  const compact = gauges.length > 4;
  return (
    <Frame theme={theme} style={{ justifyContent: "center", gap: compact ? "40px" : "72px" }}>
      <Title theme={theme} size={52} align="center" color={theme["--slide-primary-text"]} path="headline">{headline}</Title>
      <div style={{ display: "flex", justifyContent: "center", gap: compact ? "32px 48px" : "56px", flexWrap: "wrap" }}>
        {gauges.map((gauge, i) => (
          <Dial key={i} gauge={gauge} index={i} length={gauges.length} theme={theme} compact={compact} />
        ))}
      </div>
    </Frame>
  );
}
