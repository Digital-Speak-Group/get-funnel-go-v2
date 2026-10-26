"use client";

import * as React from "react";
import { Play } from "lucide-react";
import { useStaticSlide } from "../render-context";
import { useExportCapture } from "../export-mode";
import { THEME_ROLE_VARS, type FreeVideo, type ThemeRole } from "@/lib/slides/free";
import { videoEmbedUrl, videoThumbnailUrl } from "@/lib/slides/video";

const role = (r: ThemeRole) => `var(${THEME_ROLE_VARS[r]})`;

/** Third-party player: its own origin, scripts allowed, no top navigation (same rules as embeds). */
const VIDEO_SANDBOX = "allow-scripts allow-same-origin allow-presentation allow-popups";

/**
 * Video of a freeform slide (Task 78): the YouTube/Vimeo player when the slide is shown live;
 * a still frame with a play badge in the editor, thumbnails and exports (an iframe would
 * swallow the editor's clicks, forty players would load in the slide rail, and a capture would
 * catch a loading player).
 */
export function VideoBody({ element, editing }: { element: FreeVideo; editing: boolean }) {
  const isStatic = useStaticSlide();
  const exporting = useExportCapture();
  const radius = 12;

  if (!editing && !isStatic && !exporting) {
    return (
      <iframe
        src={videoEmbedUrl(element.provider, element.videoId)}
        title="Vidéo"
        sandbox={VIDEO_SANDBOX}
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        loading="lazy"
        style={{ width: "100%", height: "100%", border: 0, borderRadius: radius, background: role("surface"), display: "block" }}
      />
    );
  }

  const thumbnail = videoThumbnailUrl(element.provider, element.videoId);
  const badge = Math.max(48, Math.min(140, Math.min(element.w, element.h) / 4));
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        borderRadius: radius,
        overflow: "hidden",
        background: role("surface"),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {thumbnail && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumbnail} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      )}
      <span
        aria-hidden="true"
        style={{
          position: "relative",
          width: badge,
          height: badge,
          borderRadius: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: role("primary"),
          color: "var(--slide-primary-fg)",
          boxShadow: "0 6px 24px rgb(0 0 0 / 0.3)",
        }}
      >
        <Play size={badge * 0.45} fill="currentColor" />
      </span>
    </div>
  );
}
