"use client";

import * as React from "react";

/**
 * How far a slide's build-up has gone (Task 75). `upTo`: elements whose reveal step is ≤ it
 * are visible. `mode`: "audience" animates hidden elements in; "presenter" shows them ghosted
 * so the presenter sees what comes next. Default (editor, thumbnails, exports): all visible.
 */
export interface RevealState {
  upTo: number;
  mode: "audience" | "presenter";
}

const RevealContext = React.createContext<RevealState>({ upTo: Infinity, mode: "audience" });

export function RevealProvider({ value, children }: { value: RevealState; children: React.ReactNode }) {
  return <RevealContext.Provider value={value}>{children}</RevealContext.Provider>;
}

export function useReveal(): RevealState {
  return React.useContext(RevealContext);
}
