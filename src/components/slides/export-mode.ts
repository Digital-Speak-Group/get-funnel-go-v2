"use client";

import * as React from "react";

/** Set by the PDF/PowerPoint capture before the audience page loads (slide-capture.ts). */
export const EXPORT_FLAG = "__GF_EXPORT__";

const noop = () => () => {};

/**
 * True inside an export capture: live content (video players) renders a still frame instead,
 * so the exported slide shows the picture, not a loading player. The public URL is unchanged.
 */
export function useExportCapture(): boolean {
  return React.useSyncExternalStore(
    noop,
    () => Boolean((window as unknown as Record<string, unknown>)[EXPORT_FLAG]),
    () => false
  );
}
