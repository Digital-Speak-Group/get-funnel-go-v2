"use client";

import * as React from "react";
import { getBackgroundStyles } from "@/lib/slides/theme";

type BackgroundProps = {
  background: "solid" | "grid" | "gradient" | "noise";
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export function SlideBackground({ background, children, className, style }: BackgroundProps) {
  const bgStyles = getBackgroundStyles(background);

  return (
    <div
      className={className}
      style={{
        ...bgStyles,
        ...style,
        position: "absolute",
        inset: 0,
        zIndex: 0,
      }}
    >
      {children}
    </div>
  );
}