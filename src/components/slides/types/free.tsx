"use client";

import * as React from "react";
import { SlideIcon } from "../icons";
import { useAssetUrl } from "../asset-url";
import { ImagePlus } from "lucide-react";
import { EditableText, useRichTextEditor, useSlideEditing } from "../editable";
import { RichTextView } from "../RichTextView";
import { SHAPE_PATHS } from "../shape-paths";
import { TableBody } from "./free-table";
import { ChartBody } from "./free-chart";
import { VideoBody } from "./free-video";
import { plainToRich } from "@/lib/slides/rich-text";
import { useReveal, type RevealState } from "../reveal-context";
import {
  TEXT_STYLE_SPECS,
  THEME_ROLE_VARS,
  type FreeElement,
  type FreeImage,
  type FreeShape,
  type FreeText,
  type ThemeRole,
} from "@/lib/slides/free";

interface FreeContent {
  elements: FreeElement[];
}

const role = (r: ThemeRole) => `var(${THEME_ROLE_VARS[r]})`;

const REVEAL_OFFSET: Record<NonNullable<FreeElement["reveal"]>["effect"], string> = {
  fade: "",
  rise: " translateY(48px)",
  zoom: " scale(0.8)",
};

/**
 * Opacity/transform of an element with a build step (Task 75): hidden until its step, then
 * animated in (audience) or shown ghosted (presenter, who sees what comes next).
 */
const SHADOWS = {
  soft: "drop-shadow(0 8px 24px rgb(0 0 0 / 0.22))",
  strong: "drop-shadow(0 18px 40px rgb(0 0 0 / 0.42))",
} as const;

function revealStyle(element: FreeElement, reveal: RevealState): React.CSSProperties {
  const base = element.opacity ?? 1;
  const rotate = element.rotation ? `rotate(${element.rotation}deg)` : "";
  if (!element.reveal) return { opacity: element.opacity, transform: rotate || undefined };
  const hidden = element.reveal.step > reveal.upTo;
  if (reveal.mode === "presenter") return { opacity: hidden ? base * 0.25 : element.opacity, transform: rotate || undefined };
  return {
    opacity: hidden ? 0 : element.opacity,
    transform: (rotate + (hidden ? REVEAL_OFFSET[element.reveal.effect] : "")).trim() || undefined,
    transition: "opacity 500ms ease-out, transform 600ms cubic-bezier(0.16, 1, 0.3, 1)",
  };
}

/** Freeform slide (Task 68): absolutely positioned text, shapes, images and icons. */
export function FreeSlide({ content }: { content: FreeContent; theme: Record<string, string> }) {
  const elements = Array.isArray(content.elements) ? content.elements : [];
  const editing = useSlideEditing();
  const reveal = useReveal();
  return (
    <div style={{ position: "absolute", inset: 0 }} data-free-canvas="">
      {/* Snapping target for the 96px safe margins (editor only, invisible). */}
      {editing && <div data-free-safe="" aria-hidden="true" style={{ position: "absolute", inset: "96px", pointerEvents: "none" }} />}
      {elements.map((element, index) => (
        <div
          key={element.id}
          data-free-id={element.id}
          style={{
            position: "absolute",
            left: `${element.x}px`,
            top: `${element.y}px`,
            width: `${element.w}px`,
            height: `${element.h}px`,
            ...revealStyle(element, reveal),
            // Follows the element's own outline (text glyphs, SVG shapes, images).
            filter: element.shadow ? SHADOWS[element.shadow] : undefined,
          }}
        >
          <ElementBody element={element} index={index} editing={editing} />
          {editing && element.reveal && <RevealBadge step={element.reveal.step} />}
        </div>
      ))}
    </div>
  );
}

function ElementBody({ element, index, editing }: { element: FreeElement; index: number; editing: boolean }) {
  switch (element.kind) {
    case "text":
      return <TextBody element={element} index={index} />;
    case "shape":
      return <ShapeBody element={element} />;
    case "image":
      return <ImageBody element={element} editing={editing} />;
    case "icon":
      return (
        <span style={{ display: "flex", width: "100%", height: "100%", color: role(element.color ?? "primary") }}>
          <SlideIcon name={element.icon} size={Math.min(element.w, element.h)} />
        </span>
      );
    case "table":
      return <TableBody element={element} index={index} />;
    case "chart":
      return <ChartBody element={element} />;
    case "video":
      return <VideoBody element={element} editing={editing} />;
  }
}

function TextBody({ element, index }: { element: FreeText; index: number }) {
  const spec = TEXT_STYLE_SPECS[element.style];
  const rich = useRichTextEditor();
  const style: React.CSSProperties = {
    width: "100%",
    margin: 0,
    fontSize: `${element.size ?? spec.size}px`,
    lineHeight: element.lineHeight ?? spec.lineHeight,
    letterSpacing: element.letterSpacing ? `${element.letterSpacing}em` : undefined,
    fontWeight: element.weight === "bold" ? 700 : element.weight === "regular" ? 400 : spec.weight,
    fontFamily: `var(--slide-font-${spec.font})`,
    color: role(element.color ?? spec.color),
    textAlign: element.align ?? "left",
    whiteSpace: "pre-wrap",
    overflowWrap: "break-word",
  };
  const path = `elements.${index}`;

  // In the editor: the rich text field (Task 76). Elsewhere: the formatted text, or plain.
  if (rich) {
    return <rich.Editor path={path} value={element.rich ?? plainToRich(element.text)} placeholder={rich.placeholderFor(`${path}.text`)} style={style} />;
  }
  if (element.rich) {
    return (
      <div style={style}>
        <RichTextView rich={element.rich} />
      </div>
    );
  }
  return <EditableText as="div" path={`${path}.text`} value={element.text} multiline style={style} />;
}

const DASH_ARRAY = { solid: undefined, dashed: "3 2", dotted: "0.1 2" } as const;

function ShapeBody({ element }: { element: FreeShape }) {
  const fill = element.fill ? role(element.fill) : element.stroke ? "transparent" : role("primary");
  const width = element.strokeWidth ?? 4;
  const path = SHAPE_PATHS[element.shape];
  if (path) {
    // Stretched to the box; the border keeps its pixel width (non-scaling stroke).
    return (
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%" style={{ display: "block", overflow: "visible" }} aria-hidden="true">
        <path
          d={path}
          fill={fill}
          stroke={element.stroke ? role(element.stroke) : "none"}
          strokeWidth={width}
          strokeDasharray={element.dash && element.dash !== "solid" ? DASH_ARRAY[element.dash].split(" ").map((n) => Number(n) * width).join(" ") : undefined}
          strokeLinecap={element.dash === "dotted" ? "round" : "butt"}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  }
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: fill,
        border: element.stroke ? `${width}px ${element.dash ?? "solid"} ${role(element.stroke)}` : undefined,
        borderRadius: element.shape === "ellipse" ? "50%" : element.shape === "line" ? "9999px" : `${element.radius ?? 0}px`,
        boxSizing: "border-box",
      }}
    />
  );
}

/** Images are picked from the editor's toolbar (or a double-click), not an overlay button. */
function ImageBody({ element, editing }: { element: FreeImage; editing: boolean }) {
  const assetUrl = useAssetUrl();
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => setFailed(false), [element.assetId]);
  const radius = `${element.radius ?? 0}px`;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: radius, overflow: "hidden" }}>
      {element.assetId && !failed ? (
        // Plain <img>: slides render at a fixed 1920×1080 and are CSS-scaled (also in exports).
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={assetUrl(element.assetId)}
          alt=""
          onError={() => setFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: element.fit ?? "cover", display: "block" }}
        />
      ) : (
        <div
          aria-hidden="true"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            color: role("muted"),
            background: role("surface"),
            border: editing ? `3px dashed ${role("muted")}` : undefined,
            borderRadius: radius,
            boxSizing: "border-box",
          }}
        >
          {editing && <ImagePlus size={Math.min(96, element.w / 3, element.h / 3)} strokeWidth={1.5} />}
        </div>
      )}
    </div>
  );
}

/** Editor-only marker of an element's build step (Task 75). */
function RevealBadge({ step }: { step: number }) {
  return (
    <span
      aria-hidden="true"
      data-reveal-badge={step}
      style={{
        position: "absolute",
        top: -18,
        left: -18,
        width: 40,
        height: 40,
        borderRadius: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 22,
        fontWeight: 700,
        fontFamily: "var(--slide-font-body)",
        background: role("primary"),
        color: "var(--slide-primary-fg)",
        boxShadow: "0 2px 8px rgb(0 0 0 / 0.25)",
      }}
    >
      {step}
    </span>
  );
}
