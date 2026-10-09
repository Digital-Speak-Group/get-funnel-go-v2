import * as React from "react";
import type { IllustrationName } from "@/lib/slides/illustrations";

/** Theme colours an illustration is drawn with (hex values from the deck theme). */
export interface IllustrationColors {
  primary: string;
  accent: string;
  muted: string;
}

type Draw = (c: IllustrationColors, uid: string) => React.ReactNode;

/*
 * Each drawing sits in a 400×300 box. Moving parts carry a `gfi-*` class; the animations are
 * defined once in Illustration.tsx and only run when the slide is shown live.
 */

const funnel: Draw = (c, uid) => (
  <>
    <defs>
      <linearGradient id={`${uid}-f`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={c.primary} stopOpacity="0.55" />
        <stop offset="1" stopColor={c.accent} stopOpacity="0.25" />
      </linearGradient>
    </defs>
    {["M50 40 L350 40 L320 110 L80 110 Z", "M80 120 L320 120 L290 190 L110 190 Z", "M110 200 L290 200 L260 270 L140 270 Z"].map((d, i) => (
      <path key={i} d={d} fill={`url(#${uid}-f)`} stroke={i % 2 ? c.accent : c.primary} strokeWidth="2" className="gfi-draw" style={{ animationDelay: `${i * 0.3}s` }} />
    ))}
    {[70, 150, 230].map((y, i) => (
      <path key={i} d={`M193 ${y} L200 ${y + 10} L207 ${y}`} stroke={c.primary} strokeWidth="2.5" strokeLinecap="round" fill="none" className="gfi-blink" style={{ animationDelay: `${i * 0.4}s` }} />
    ))}
    {Array.from({ length: 10 }, (_, i) => (
      <circle key={i} cx={95 + i * 23} cy={75 - (i % 3) * 8} r="3.5" fill={i % 2 ? c.accent : c.primary} className="gfi-fall" style={{ animationDelay: `${i * 0.25}s` }} />
    ))}
  </>
);

const automation: Draw = (c) => (
  <>
    <circle cx="200" cy="150" r="38" fill={c.primary} opacity="0.45" className="gfi-pulse" />
    <circle cx="200" cy="150" r="62" stroke={c.primary} strokeWidth="2" strokeDasharray="8 8" opacity="0.5" fill="none" className="gfi-spin" />
    <circle cx="200" cy="150" r="84" stroke={c.accent} strokeWidth="2" strokeDasharray="12 12" opacity="0.35" fill="none" className="gfi-spin-rev" />
    {[0, 120, 240].map((angle, i) => {
      const rad = (angle * Math.PI) / 180;
      const x = 200 + 110 * Math.cos(rad);
      const y = 150 + 110 * Math.sin(rad);
      return (
        <g key={i}>
          <line x1="200" y1="150" x2={x} y2={y} stroke={c.muted} strokeWidth="1.5" opacity="0.5" />
          <circle cx={x} cy={y} r="16" fill={i % 2 ? c.accent : c.primary} opacity="0.75" className="gfi-pulse" style={{ animationDelay: `${i * 0.5}s` }} />
        </g>
      );
    })}
  </>
);

const dashboard: Draw = (c) => (
  <>
    <rect x="40" y="30" width="320" height="240" rx="14" stroke={c.muted} strokeOpacity="0.5" strokeWidth="2" fill="none" />
    <line x1="40" y1="62" x2="360" y2="62" stroke={c.muted} strokeOpacity="0.4" strokeWidth="2" />
    {[0, 1, 2].map((i) => (
      <circle key={i} cx={58 + i * 14} cy="46" r="4" fill={c.muted} opacity="0.6" />
    ))}
    {[60, 95, 75, 130, 110, 150].map((h, i) => (
      <rect key={i} x={70 + i * 34} y={250 - h} width="22" height={h} rx="4" fill={i % 2 ? c.accent : c.primary} opacity="0.7" className="gfi-grow" style={{ animationDelay: `${i * 0.15}s` }} />
    ))}
    <polyline points="70,180 110,160 150,170 190,120 230,135 270,90 300,80" stroke={c.accent} strokeWidth="3" fill="none" strokeLinecap="round" className="gfi-draw" />
  </>
);

const datastream: Draw = (c) => (
  <>
    {[80, 160, 240, 320].map((x, i) => (
      <g key={x}>
        <line x1={x} y1="10" x2={x} y2="290" stroke={i % 2 ? c.accent : c.primary} strokeOpacity="0.35" strokeWidth="1.5" />
        {[0, 1, 2].map((j) => (
          <circle key={j} cx={x} cy="20" r="4" fill={i % 2 ? c.accent : c.primary} className="gfi-stream" style={{ animationDelay: `${i * 0.3 + j * 1}s` }} />
        ))}
      </g>
    ))}
    {Array.from({ length: 12 }, (_, i) => (
      <circle key={i} cx={80 + (i % 4) * 80} cy={70 + Math.floor(i / 4) * 80} r="5" fill={c.primary} opacity="0.55" />
    ))}
  </>
);

const NET_NODES = [
  [100, 80], [200, 45], [300, 80], [150, 155], [250, 155], [200, 240],
] as const;
const NET_LINKS = [[0, 1], [1, 2], [0, 3], [1, 3], [1, 4], [2, 4], [3, 5], [4, 5]] as const;

const network: Draw = (c) => (
  <>
    {NET_LINKS.map(([a, b], i) => (
      <line key={i} x1={NET_NODES[a][0]} y1={NET_NODES[a][1]} x2={NET_NODES[b][0]} y2={NET_NODES[b][1]} stroke={c.primary} strokeOpacity="0.45" strokeWidth="2" />
    ))}
    {NET_LINKS.map(([a, b], i) => (
      <circle
        key={`p${i}`}
        r="4"
        fill={c.accent}
        className="gfi-travel"
        style={{ offsetPath: `path("M${NET_NODES[a][0]} ${NET_NODES[a][1]} L${NET_NODES[b][0]} ${NET_NODES[b][1]}")`, animationDelay: `${i * 0.35}s` }}
      />
    ))}
    {NET_NODES.map(([x, y], i) => (
      <g key={i}>
        <circle cx={x} cy={y} r="18" fill={c.primary} opacity="0.18" />
        <circle cx={x} cy={y} r="9" fill={i % 2 ? c.accent : c.primary} />
      </g>
    ))}
  </>
);

const orbit: Draw = (c) => (
  <>
    <circle cx="200" cy="150" r="46" fill={c.primary} opacity="0.3" className="gfi-pulse" />
    {[70, 100, 130].map((r, i) => (
      <g key={r} className={i % 2 ? "gfi-spin-rev" : "gfi-spin"} style={{ animationDuration: `${14 + i * 6}s` }}>
        <circle cx="200" cy="150" r={r} stroke={c.muted} strokeOpacity="0.35" strokeWidth="1.5" fill="none" />
        <circle cx="200" cy={150 - r} r={7 - i} fill={i % 2 ? c.accent : c.primary} />
      </g>
    ))}
  </>
);

const target: Draw = (c) => (
  <>
    {[120, 90, 60, 30].map((r, i) => (
      <circle key={r} cx="200" cy="150" r={r} stroke={i % 2 ? c.accent : c.primary} strokeWidth="2.5" strokeOpacity="0.7" fill="none" />
    ))}
    <circle cx="200" cy="150" r="30" stroke={c.accent} strokeWidth="3" fill="none" className="gfi-ripple" />
    <circle cx="200" cy="150" r="12" fill={c.accent} />
    {[0, 90, 180, 270].map((angle) => {
      const rad = (angle * Math.PI) / 180;
      return (
        <g key={angle}>
          <line x1={200 + 140 * Math.cos(rad)} y1={150 + 140 * Math.sin(rad)} x2={200 + 42 * Math.cos(rad)} y2={150 + 42 * Math.sin(rad)} stroke={c.primary} strokeWidth="2" />
          <circle cx={200 + 140 * Math.cos(rad)} cy={150 + 140 * Math.sin(rad)} r="6" fill={c.accent} />
        </g>
      );
    })}
  </>
);

const shapes: Draw = (c) => (
  <>
    <polygon points="90,210 140,120 190,210" stroke={c.primary} strokeWidth="3" fill={c.primary} fillOpacity="0.15" className="gfi-float" />
    <rect x="220" y="70" width="90" height="90" rx="10" stroke={c.accent} strokeWidth="3" fill={c.accent} fillOpacity="0.15" className="gfi-float" style={{ animationDelay: "0.8s" }} />
    <circle cx="300" cy="225" r="38" stroke={c.primary} strokeWidth="3" fill="none" className="gfi-float" style={{ animationDelay: "1.6s" }} />
    <circle cx="110" cy="80" r="14" fill={c.accent} opacity="0.7" className="gfi-float" style={{ animationDelay: "0.4s" }} />
  </>
);

const wave: Draw = (c) => (
  <>
    {[0, 1, 2].map((i) => (
      <path
        key={i}
        d={`M0 ${170 + i * 30} Q100 ${130 + i * 30} 200 ${170 + i * 30} T400 ${170 + i * 30} V300 H0 Z`}
        fill={i % 2 ? c.accent : c.primary}
        opacity={0.35 - i * 0.08}
        className="gfi-sway"
        style={{ animationDelay: `${i * 1.2}s` }}
      />
    ))}
  </>
);

const radar: Draw = (c, uid) => (
  <>
    <defs>
      <radialGradient id={`${uid}-r`} cx="0" cy="0" r="1">
        <stop offset="0" stopColor={c.primary} stopOpacity="0.6" />
        <stop offset="1" stopColor={c.primary} stopOpacity="0" />
      </radialGradient>
    </defs>
    {[40, 80, 120].map((r) => (
      <circle key={r} cx="200" cy="150" r={r} stroke={c.primary} strokeOpacity="0.4" strokeWidth="1.5" fill="none" />
    ))}
    <line x1="80" y1="150" x2="320" y2="150" stroke={c.muted} strokeOpacity="0.35" />
    <line x1="200" y1="30" x2="200" y2="270" stroke={c.muted} strokeOpacity="0.35" />
    {/* Sweep: a 60° wedge rotating around the centre */}
    <path d="M200 150 L320 150 A120 120 0 0 0 260 46 Z" fill={c.primary} fillOpacity="0.28" className="gfi-sweep" />
    {[[250, 100], [150, 200], [280, 190], [130, 110]].map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r="6" fill={c.accent} className="gfi-blink" style={{ animationDelay: `${i * 0.7}s` }} />
    ))}
  </>
);

const PACKET_PATH = "M30 230 C110 230 110 70 200 70 S290 230 370 230";
const packets: Draw = (c) => (
  <>
    <path d={PACKET_PATH} stroke={c.primary} strokeOpacity="0.4" strokeWidth="3" fill="none" strokeDasharray="6 8" />
    {[[30, 230], [200, 70], [370, 230]].map(([x, y], i) => (
      <g key={i}>
        <circle cx={x} cy={y} r="20" fill={c.primary} opacity="0.2" />
        <circle cx={x} cy={y} r="10" fill={i === 1 ? c.accent : c.primary} />
      </g>
    ))}
    {[0, 1, 2, 3].map((i) => (
      <rect key={i} x="-7" y="-5" width="14" height="10" rx="3" fill={c.accent} className="gfi-travel" style={{ offsetPath: `path("${PACKET_PATH}")`, animationDuration: "4s", animationDelay: `${i}s` }} />
    ))}
  </>
);

const HEX = (cx: number, cy: number, r: number) =>
  Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i + Math.PI / 6;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");

const honeycomb: Draw = (c) => {
  const r = 34;
  const w = Math.sqrt(3) * r;
  const cells: Array<[number, number]> = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 5; col++) {
      cells.push([60 + col * w + (row % 2 ? w / 2 : 0), 50 + row * r * 1.5]);
    }
  }
  return (
    <>
      {cells.map(([x, y], i) => {
        const lit = [2, 6, 8, 12, 16].includes(i);
        return (
          <polygon
            key={i}
            points={HEX(x, y, r - 3)}
            stroke={lit ? c.accent : c.primary}
            strokeOpacity={lit ? 0.9 : 0.35}
            strokeWidth="2"
            fill={lit ? c.accent : c.primary}
            fillOpacity={lit ? 0.35 : 0.06}
            className={lit ? "gfi-pulse" : undefined}
            style={lit ? { animationDelay: `${(i % 5) * 0.4}s` } : undefined}
          />
        );
      })}
    </>
  );
};

export const DRAWINGS: Record<IllustrationName, Draw> = {
  funnel,
  automation,
  dashboard,
  datastream,
  network,
  orbit,
  target,
  shapes,
  wave,
  radar,
  packets,
  honeycomb,
};
