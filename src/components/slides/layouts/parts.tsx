import * as React from "react";
import { headlineFill } from "../style";
import { EditableText } from "../editable";

/** The CSS-var record slide components receive (`tokensToCssVars` output). */
export type SlideTheme = Record<string, string>;

export interface LayoutProps<C> {
  content: C;
  theme: SlideTheme;
}

/** Full-canvas frame shared by the layout variants (same 96px safe area as the originals). */
export function Frame({
  theme,
  children,
  style,
}: {
  theme: SlideTheme;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: "96px",
        fontFamily: theme["--slide-font-body"],
        color: theme["--slide-text"],
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** With `path`, the text is editable on the editor canvas (`children` must then be the string). */
export function Title({
  theme,
  children,
  path,
  size = 48,
  color,
  align = "left",
  maxWidth,
  style,
}: {
  theme: SlideTheme;
  children: React.ReactNode;
  path?: string;
  size?: number;
  color?: string;
  align?: React.CSSProperties["textAlign"];
  maxWidth?: string;
  style?: React.CSSProperties;
}) {
  const titleStyle: React.CSSProperties = {
    fontSize: `${size}px`,
    lineHeight: size >= 72 ? 1.05 : 1.15,
    fontWeight: size >= 72 ? 800 : 700,
    fontFamily: theme["--slide-font-display"],
    textAlign: align,
    margin: 0,
    maxWidth,
    ...headlineFill(theme, color ?? theme["--slide-text"]),
    ...style,
  };
  if (path) return <EditableText as="h1" path={path} value={children as string} style={titleStyle} />;
  return <h1 style={titleStyle}>{children}</h1>;
}

export function Lead({
  theme,
  children,
  path,
  style,
}: {
  theme: SlideTheme;
  children: React.ReactNode;
  path?: string;
  style?: React.CSSProperties;
}) {
  const leadStyle: React.CSSProperties = { fontSize: "22px", lineHeight: 1.45, color: theme["--slide-muted"], margin: 0, ...style };
  if (path) return <EditableText as="p" path={path} value={children as string} style={leadStyle} multiline />;
  return <p style={leadStyle}>{children}</p>;
}

/** Two-digit index ("01") used by list and timeline layouts. */
export const pad = (n: number) => String(n).padStart(2, "0");
