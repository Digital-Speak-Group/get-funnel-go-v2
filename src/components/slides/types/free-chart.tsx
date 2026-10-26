"use client";

import * as React from "react";
import { THEME_ROLE_VARS, type FreeChart, type ThemeRole } from "@/lib/slides/free";

const role = (r: ThemeRole) => `var(${THEME_ROLE_VARS[r]})`;
/** Slice colours of pie/donut charts, in order (repeated lighter past six). */
const PALETTE: ThemeRole[] = ["primary", "accent", "success", "danger", "muted", "text"];

const number = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });

interface Geometry {
  w: number;
  h: number;
  font: number;
  fmt: (v: number) => string;
  color: string;
  showValues: boolean;
}

/**
 * Chart of a freeform slide (Task 78): bar, horizontal bar, line, pie, donut. Drawn as SVG in
 * the element's own pixel space (no stretching), with theme colours and fonts.
 */
export function ChartBody({ element }: { element: FreeChart }) {
  const { w, h } = element;
  const font = Math.max(14, Math.min(32, Math.round(Math.min(w, h) / 14)));
  const g: Geometry = {
    w,
    h,
    font,
    fmt: (v) => `${number.format(v)}${element.unit ? ` ${element.unit}` : ""}`,
    color: role(element.color ?? "primary"),
    showValues: element.showValues ?? true,
  };
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width="100%"
      height="100%"
      style={{ display: "block", overflow: "visible", fontFamily: "var(--slide-font-body)" }}
      role="img"
      aria-label={element.data.map((d) => `${d.label} : ${g.fmt(d.value)}`).join(", ")}
    >
      {element.chart === "bar" && <Bars data={element.data} g={g} />}
      {element.chart === "hbar" && <HBars data={element.data} g={g} />}
      {element.chart === "line" && <Line data={element.data} g={g} />}
      {(element.chart === "pie" || element.chart === "donut") && <Pie data={element.data} g={g} donut={element.chart === "donut"} />}
    </svg>
  );
}

type Data = FreeChart["data"];

const range = (data: Data) => {
  const min = Math.min(0, ...data.map((d) => d.value));
  const max = Math.max(0, ...data.map((d) => d.value));
  return { min, max, span: max - min || 1 };
};

function Bars({ data, g }: { data: Data; g: Geometry }) {
  const top = g.showValues ? g.font * 1.6 : g.font * 0.5;
  const bottom = g.font * 1.9;
  const plotH = g.h - top - bottom;
  const { max, span } = range(data);
  const y = (v: number) => top + ((max - v) / span) * plotH;
  const slot = g.w / data.length;
  const barW = slot * 0.62;
  return (
    <g>
      {data.map((d, i) => {
        const x = i * slot + (slot - barW) / 2;
        const y1 = y(Math.max(d.value, 0));
        const y2 = y(Math.min(d.value, 0));
        return (
          <g key={i}>
            <rect x={x} y={y1} width={barW} height={Math.max(1, y2 - y1)} rx={Math.min(10, barW / 6)} fill={g.color} />
            {g.showValues && (
              <text x={x + barW / 2} y={d.value >= 0 ? y1 - g.font * 0.45 : y2 + g.font * 1.1} textAnchor="middle" fontSize={g.font} fontWeight={700} fill={role("text")}>
                {g.fmt(d.value)}
              </text>
            )}
            <text x={x + barW / 2} y={g.h - g.font * 0.5} textAnchor="middle" fontSize={g.font * 0.85} fill={role("muted")}>
              {d.label}
            </text>
          </g>
        );
      })}
      <line x1={0} x2={g.w} y1={y(0)} y2={y(0)} stroke={role("muted")} strokeOpacity={0.5} strokeWidth={2} />
    </g>
  );
}

function HBars({ data, g }: { data: Data; g: Geometry }) {
  const labelW = Math.min(g.w * 0.32, g.font * 9);
  const right = g.showValues ? g.font * 4 : g.font * 0.5;
  const plotW = g.w - labelW - right;
  const { min, span } = range(data);
  const x = (v: number) => labelW + ((v - min) / span) * plotW;
  const slot = g.h / data.length;
  const barH = slot * 0.62;
  return (
    <g>
      {data.map((d, i) => {
        const yy = i * slot + (slot - barH) / 2;
        const x1 = x(Math.min(d.value, 0));
        const x2 = x(Math.max(d.value, 0));
        return (
          <g key={i}>
            <text x={labelW - g.font * 0.5} y={yy + barH / 2} dominantBaseline="middle" textAnchor="end" fontSize={g.font * 0.85} fill={role("muted")}>
              {d.label}
            </text>
            <rect x={x1} y={yy} width={Math.max(1, x2 - x1)} height={barH} rx={Math.min(10, barH / 6)} fill={g.color} />
            {g.showValues && (
              <text x={x2 + g.font * 0.4} y={yy + barH / 2} dominantBaseline="middle" fontSize={g.font} fontWeight={700} fill={role("text")}>
                {g.fmt(d.value)}
              </text>
            )}
          </g>
        );
      })}
      <line x1={x(0)} x2={x(0)} y1={0} y2={g.h} stroke={role("muted")} strokeOpacity={0.5} strokeWidth={2} />
    </g>
  );
}

function Line({ data, g }: { data: Data; g: Geometry }) {
  const top = g.showValues ? g.font * 1.7 : g.font * 0.6;
  const bottom = g.font * 1.9;
  const side = g.font * 1.2;
  const plotH = g.h - top - bottom;
  const { max, span } = range(data);
  const step = data.length > 1 ? (g.w - side * 2) / (data.length - 1) : 0;
  const pts = data.map((d, i) => ({ x: data.length > 1 ? side + i * step : g.w / 2, y: top + ((max - d.value) / span) * plotH, d }));
  const path = pts.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(" ");
  const base = top + (max / span) * plotH;
  const stroke = Math.max(3, g.font / 5);
  return (
    <g>
      {pts.length > 1 && <path d={`${path} L${pts[pts.length - 1].x},${base} L${pts[0].x},${base} Z`} fill={g.color} fillOpacity={0.12} />}
      <line x1={0} x2={g.w} y1={base} y2={base} stroke={role("muted")} strokeOpacity={0.5} strokeWidth={2} />
      <path d={path} fill="none" stroke={g.color} strokeWidth={stroke} strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={stroke * 1.6} fill={role("bg")} stroke={g.color} strokeWidth={stroke} />
          {g.showValues && (
            <text x={p.x} y={p.y - g.font * 0.7} textAnchor="middle" fontSize={g.font} fontWeight={700} fill={role("text")}>
              {g.fmt(p.d.value)}
            </text>
          )}
          <text x={p.x} y={g.h - g.font * 0.5} textAnchor="middle" fontSize={g.font * 0.85} fill={role("muted")}>
            {p.d.label}
          </text>
        </g>
      ))}
    </g>
  );
}

function arc(cx: number, cy: number, r: number, inner: number, a0: number, a1: number): string {
  const p = (radius: number, a: number) => `${cx + radius * Math.cos(a)},${cy + radius * Math.sin(a)}`;
  const large = a1 - a0 > Math.PI ? 1 : 0;
  if (inner <= 0) return `M${cx},${cy} L${p(r, a0)} A${r},${r} 0 ${large} 1 ${p(r, a1)} Z`;
  return `M${p(r, a0)} A${r},${r} 0 ${large} 1 ${p(r, a1)} L${p(inner, a1)} A${inner},${inner} 0 ${large} 0 ${p(inner, a0)} Z`;
}

function Pie({ data, g, donut }: { data: Data; g: Geometry; donut: boolean }) {
  const slices = data.map((d) => ({ ...d, value: Math.max(0, d.value) }));
  const total = slices.reduce((s, d) => s + d.value, 0);
  const legendBeside = g.w >= g.h * 1.3;
  const size = legendBeside ? Math.min(g.h, g.w * 0.55) : Math.min(g.w, g.h * 0.62);
  const r = size / 2 - 4;
  const cx = legendBeside ? r + 4 : g.w / 2;
  const cy = legendBeside ? g.h / 2 : r + 4;
  const inner = donut ? r * 0.58 : 0;
  const fill = (i: number) => role(PALETTE[i % PALETTE.length]);
  const opacity = (i: number) => (i < PALETTE.length ? 1 : 0.6);

  let angle = -Math.PI / 2;
  const legendX = legendBeside ? cx + r + g.font * 1.5 : g.font;
  const legendY = legendBeside ? Math.max(g.font, g.h / 2 - (data.length * g.font * 1.5) / 2) : cy + r + g.font * 1.5;

  return (
    <g>
      {total === 0 ? (
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={role("muted")} strokeOpacity={0.4} strokeWidth={4} />
      ) : (
        slices.map((d, i) => {
          if (d.value === 0) return null;
          const a0 = angle;
          const a1 = angle + (d.value / total) * Math.PI * 2;
          angle = a1;
          // A single 100 % slice: an arc from a point to itself draws nothing.
          if (d.value === total) {
            return (
              <g key={i}>
                <circle cx={cx} cy={cy} r={r} fill={fill(i)} />
                {donut && <circle cx={cx} cy={cy} r={inner} fill={role("bg")} />}
              </g>
            );
          }
          return <path key={i} d={arc(cx, cy, r, inner, a0, a1)} fill={fill(i)} fillOpacity={opacity(i)} stroke={role("bg")} strokeWidth={3} />;
        })
      )}
      {data.map((d, i) => {
        const y = legendY + i * g.font * 1.5;
        const percent = total ? Math.round((Math.max(0, d.value) / total) * 100) : 0;
        return (
          <g key={`legend-${i}`}>
            <rect x={legendX} y={y - g.font * 0.75} width={g.font * 0.9} height={g.font * 0.9} rx={g.font * 0.2} fill={fill(i)} fillOpacity={opacity(i)} />
            <text x={legendX + g.font * 1.4} y={y} fontSize={g.font * 0.9} fill={role("text")}>
              {d.label}
              {g.showValues && <tspan fill={role("muted")}>{`  ${percent} %`}</tspan>}
            </text>
          </g>
        );
      })}
    </g>
  );
}
