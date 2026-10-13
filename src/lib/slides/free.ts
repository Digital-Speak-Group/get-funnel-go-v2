import { z } from "zod";
import { SLIDE_ICON_NAMES } from "./icons";

/**
 * Freeform ("Libre") slides — Task 68, docs/freeform-slides.md. Elements are absolutely
 * positioned in the 1920×1080 design space; colours are theme roles (never hex), so a theme
 * switch recolours them like any other slide.
 */

export const CANVAS_WIDTH = 1920;
export const CANVAS_HEIGHT = 1080;
export const MAX_FREE_ELEMENTS = 60;

export const THEME_ROLES = ["text", "muted", "primary", "accent", "surface", "bg", "danger", "success"] as const;
export type ThemeRole = (typeof THEME_ROLES)[number];
const ThemeRoleSchema = z.enum(THEME_ROLES);

/** CSS variable set by `tokensToCssVars` for each role. */
export const THEME_ROLE_VARS: Record<ThemeRole, string> = {
  text: "--slide-text",
  muted: "--slide-muted",
  primary: "--slide-primary",
  accent: "--slide-accent",
  surface: "--slide-surface",
  bg: "--slide-bg",
  danger: "--slide-danger",
  success: "--slide-success",
};

export const TEXT_STYLES = ["title", "subtitle", "body", "caption"] as const;
export type TextStyle = (typeof TEXT_STYLES)[number];

/** Type scale of the four text styles (px in slide space; fonts come from the theme). */
export const TEXT_STYLE_SPECS: Record<TextStyle, { size: number; lineHeight: number; weight: number; font: "display" | "body"; color: ThemeRole }> = {
  title: { size: 72, lineHeight: 1.05, weight: 800, font: "display", color: "text" },
  subtitle: { size: 40, lineHeight: 1.15, weight: 700, font: "display", color: "text" },
  body: { size: 26, lineHeight: 1.45, weight: 400, font: "body", color: "text" },
  caption: { size: 18, lineHeight: 1.4, weight: 500, font: "body", color: "muted" },
};

const Coordinate = z.number().min(-CANVAS_WIDTH).max(CANVAS_WIDTH * 2);
const Size = z.number().min(8).max(CANVAS_WIDTH * 2);

const ElementBase = {
  id: z.string().uuid(),
  x: Coordinate,
  y: Coordinate,
  w: Size,
  h: Size,
  rotation: z.number().min(-180).max(180).optional(),
  opacity: z.number().min(0.1).max(1).optional(),
};

export const FreeTextSchema = z.object({
  ...ElementBase,
  kind: z.literal("text"),
  // May be empty while the user types; an empty text shows a placeholder in the editor only.
  text: z.string().max(600),
  style: z.enum(TEXT_STYLES),
  /** Font size override in px; set by "Convertir en libre" to keep the original look. */
  size: z.number().int().min(10).max(200).optional(),
  align: z.enum(["left", "center", "right"]).optional(),
  color: ThemeRoleSchema.optional(),
  weight: z.enum(["regular", "bold"]).optional(),
});

export const FreeShapeSchema = z.object({
  ...ElementBase,
  kind: z.literal("shape"),
  shape: z.enum(["rect", "ellipse", "line"]),
  fill: ThemeRoleSchema.optional(),
  stroke: ThemeRoleSchema.optional(),
  radius: z.number().min(0).max(540).optional(),
});

export const FreeImageSchema = z.object({
  ...ElementBase,
  kind: z.literal("image"),
  assetId: z.string().uuid().optional(),
  fit: z.enum(["cover", "contain"]).optional(),
  radius: z.number().min(0).max(540).optional(),
});

export const FreeIconSchema = z.object({
  ...ElementBase,
  kind: z.literal("icon"),
  icon: z.enum(SLIDE_ICON_NAMES),
  color: ThemeRoleSchema.optional(),
});

export const FreeElementSchema = z.discriminatedUnion("kind", [
  FreeTextSchema,
  FreeShapeSchema,
  FreeImageSchema,
  FreeIconSchema,
]);

export type FreeElement = z.infer<typeof FreeElementSchema>;
export type FreeText = z.infer<typeof FreeTextSchema>;
export type FreeShape = z.infer<typeof FreeShapeSchema>;
export type FreeImage = z.infer<typeof FreeImageSchema>;
export type FreeIcon = z.infer<typeof FreeIconSchema>;

export const FreeContentShape = {
  elements: z.array(FreeElementSchema).max(MAX_FREE_ELEMENTS),
};
