"use client";

import * as React from "react";
import { SlideIcon } from "../icons";
import { useAssetUrl } from "../asset-url";
import { ImagePlus } from "lucide-react";
import { EditableText, useSlideEditing } from "../editable";
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

/** Freeform slide (Task 68): absolutely positioned text, shapes, images and icons. */
export function FreeSlide({ content }: { content: FreeContent; theme: Record<string, string> }) {
  const elements = Array.isArray(content.elements) ? content.elements : [];
  const editing = useSlideEditing();
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
            transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
            opacity: element.opacity,
          }}
        >
          <ElementBody element={element} index={index} editing={editing} />
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
  }
}

function TextBody({ element, index }: { element: FreeText; index: number }) {
  const spec = TEXT_STYLE_SPECS[element.style];
  return (
    <EditableText
      as="div"
      path={`elements.${index}.text`}
      value={element.text}
      multiline
      style={{
        width: "100%",
        margin: 0,
        fontSize: `${element.size ?? spec.size}px`,
        lineHeight: spec.lineHeight,
        fontWeight: element.weight === "bold" ? 700 : element.weight === "regular" ? 400 : spec.weight,
        fontFamily: `var(--slide-font-${spec.font})`,
        color: role(element.color ?? spec.color),
        textAlign: element.align ?? "left",
        whiteSpace: "pre-wrap",
        overflowWrap: "break-word",
      }}
    />
  );
}

function ShapeBody({ element }: { element: FreeShape }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: element.fill ? role(element.fill) : element.stroke ? "transparent" : role("primary"),
        border: element.stroke ? `4px solid ${role(element.stroke)}` : undefined,
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
