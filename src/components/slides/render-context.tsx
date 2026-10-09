"use client";

import * as React from "react";

/**
 * Static rendering (thumbnails, next-slide preview): slides with live content (iframes,
 * lightboxes) render a still placeholder instead, so a strip of 40 thumbnails never loads 40
 * embedded pages.
 */
const StaticSlideContext = React.createContext(false);

export function StaticSlideProvider({ children }: { children: React.ReactNode }) {
  return <StaticSlideContext.Provider value={true}>{children}</StaticSlideContext.Provider>;
}

export function useStaticSlide(): boolean {
  return React.useContext(StaticSlideContext);
}

/**
 * Values typed by the presenter into `blanks` slides, keyed by slide id. Held in memory on
 * the presenter and broadcast to the audience; never saved.
 */
const LiveBlanksContext = React.createContext<Record<string, string[]>>({});

export function LiveBlanksProvider({
  values,
  children,
}: {
  values: Record<string, string[]>;
  children: React.ReactNode;
}) {
  return <LiveBlanksContext.Provider value={values}>{children}</LiveBlanksContext.Provider>;
}

export function useLiveBlanks(slideId: string): string[] | undefined {
  return React.useContext(LiveBlanksContext)[slideId];
}
