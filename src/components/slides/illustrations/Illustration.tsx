"use client";

import * as React from "react";
import { ILLUSTRATIONS, type IllustrationName } from "@/lib/slides/illustrations";
import { DRAWINGS, type IllustrationColors } from "./shapes";

/*
 * Motion lives here once, scoped under `.gfi-live`: without that class (presenter, editor,
 * thumbnails, PDF) every drawing is a still image, and reduced-motion users never get it.
 * Only transform/opacity/offset-distance are animated.
 */
const MOTION_CSS = `
.gfi-live .gfi-spin{animation:gfi-spin 18s linear infinite;transform-box:fill-box;transform-origin:center}
.gfi-live .gfi-spin-rev{animation:gfi-spin 24s linear infinite reverse;transform-box:view-box;transform-origin:200px 150px}
.gfi-live g.gfi-spin{transform-box:view-box;transform-origin:200px 150px}
.gfi-live .gfi-sweep{animation:gfi-spin 4s linear infinite;transform-box:view-box;transform-origin:200px 150px}
.gfi-live .gfi-pulse{animation:gfi-pulse 2.4s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
.gfi-live .gfi-blink{animation:gfi-blink 2s ease-in-out infinite}
.gfi-live .gfi-float{animation:gfi-float 5s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
.gfi-live .gfi-sway{animation:gfi-sway 8s ease-in-out infinite}
.gfi-live .gfi-ripple{animation:gfi-ripple 2.4s ease-out infinite;transform-box:fill-box;transform-origin:center}
.gfi-live .gfi-travel{animation:gfi-travel 2.6s linear infinite}
.gfi-live .gfi-stream{animation:gfi-stream 3s linear infinite}
.gfi-live .gfi-fall{animation:gfi-fall 3s ease-in infinite}
.gfi-live .gfi-grow{animation:gfi-grow 1.2s cubic-bezier(.22,1,.36,1) both;transform-box:fill-box;transform-origin:bottom}
.gfi-live .gfi-draw{stroke-dasharray:1200;animation:gfi-draw 2s ease-out both}
.gfi-travel{offset-rotate:0deg;offset-distance:50%}
.gfi-live .gfi-travel{offset-distance:0%}
@keyframes gfi-spin{to{transform:rotate(360deg)}}
@keyframes gfi-pulse{0%,100%{opacity:.45;transform:scale(.92)}50%{opacity:.9;transform:scale(1.06)}}
@keyframes gfi-blink{0%,100%{opacity:.2}50%{opacity:1}}
@keyframes gfi-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
@keyframes gfi-sway{0%,100%{transform:translateX(0)}50%{transform:translateX(-24px)}}
@keyframes gfi-ripple{from{opacity:.8;transform:scale(1)}to{opacity:0;transform:scale(2.2)}}
@keyframes gfi-travel{from{offset-distance:0%}to{offset-distance:100%}}
@keyframes gfi-stream{from{transform:translateY(0);opacity:0}15%{opacity:1}to{transform:translateY(260px);opacity:0}}
@keyframes gfi-fall{from{transform:translateY(0);opacity:1}to{transform:translateY(190px);opacity:0}}
@keyframes gfi-grow{from{transform:scaleY(0)}to{transform:scaleY(1)}}
@keyframes gfi-draw{from{stroke-dashoffset:1200}to{stroke-dashoffset:0}}
@media (prefers-reduced-motion: reduce){.gfi-live *{animation:none!important}.gfi-live .gfi-travel{offset-distance:50%}}
`;

export function isIllustrationName(value: unknown): value is IllustrationName {
  return typeof value === "string" && (ILLUSTRATIONS as readonly string[]).includes(value);
}

export function Illustration({
  name,
  colors,
  animate = false,
  label,
  style,
}: {
  name: IllustrationName;
  colors: IllustrationColors;
  /** Live slide with motion on; everything else gets the still drawing. */
  animate?: boolean;
  /** Accessible name; omitted for purely decorative use. */
  label?: string;
  style?: React.CSSProperties;
}) {
  const uid = `gfi-${React.useId().replace(/:/g, "")}`;
  return (
    <svg
      viewBox="0 0 400 300"
      fill="none"
      className={animate ? "gfi-live" : undefined}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-illustration={name}
      style={{ overflow: "visible", ...style }}
    >
      <style>{MOTION_CSS}</style>
      {DRAWINGS[name](colors, uid)}
    </svg>
  );
}

/** Decorative layer of a slide: bottom-right corner, behind the content. */
export function SlideIllustration({
  name,
  theme,
  animate,
}: {
  name: unknown;
  theme: Record<string, string>;
  animate: boolean;
}) {
  if (!isIllustrationName(name)) return null;
  return (
    <Illustration
      name={name}
      animate={animate}
      colors={{ primary: theme["--slide-primary"], accent: theme["--slide-accent"], muted: theme["--slide-muted"] }}
      style={{
        position: "absolute",
        right: "56px",
        bottom: "48px",
        width: "560px",
        height: "420px",
        opacity: 0.55,
        pointerEvents: "none",
      }}
    />
  );
}
