import { z } from "zod";
import { SLIDE_ICON_NAMES } from "./icons";
import { RichTextSchema } from "./rich-text";

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
export const ThemeRoleSchema = z.enum(THEME_ROLES);

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

export const REVEAL_EFFECTS = ["fade", "rise", "zoom"] as const;
export type RevealEffect = (typeof REVEAL_EFFECTS)[number];
export const MAX_REVEAL_STEP = 20;

/**
 * Build-up while presenting (Task 75): the element appears at its step (1 = first click on
 * "next"); elements sharing a step appear together. Elements without one are there from the start.
 */
export const RevealSchema = z.object({
  step: z.number().int().min(1).max(MAX_REVEAL_STEP),
  effect: z.enum(REVEAL_EFFECTS),
});
export type Reveal = z.infer<typeof RevealSchema>;

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
  /** Locked elements can be selected and styled, not moved, resized or deleted (Task 70). */
  locked: z.boolean().optional(),
  /** Elements sharing a group id are selected and moved together (Task 70). */
  groupId: z.string().uuid().optional(),
  reveal: RevealSchema.optional(),
  /** Drop shadow under the element, whatever its kind (Task 77). */
  shadow: z.enum(["soft", "strong"]).optional(),
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
  /** Formatting inside the text (Task 76); `text` stays its plain mirror. */
  rich: RichTextSchema.optional(),
  /** Line height (× font size) and letter spacing (em) overrides (Task 76). */
  lineHeight: z.number().min(0.8).max(3).optional(),
  letterSpacing: z.number().min(-0.1).max(0.5).optional(),
});

/** Box shapes are drawn with CSS; the others are SVG outlines stretched to the box (Task 77). */
export const SHAPES = ["rect", "ellipse", "line", "triangle", "diamond", "arrow", "star", "bubble"] as const;
export type ShapeName = (typeof SHAPES)[number];
export const STROKE_DASHES = ["solid", "dashed", "dotted"] as const;

export const FreeShapeSchema = z.object({
  ...ElementBase,
  kind: z.literal("shape"),
  shape: z.enum(SHAPES),
  fill: ThemeRoleSchema.optional(),
  stroke: ThemeRoleSchema.optional(),
  /** Border width in px (default 4 when there is a border colour). */
  strokeWidth: z.number().int().min(1).max(40).optional(),
  dash: z.enum(STROKE_DASHES).optional(),
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

export const MAX_TABLE_ROWS = 12;
export const MAX_TABLE_COLS = 8;

/** A table (Task 78): cells are plain text, edited on the canvas; the first row can be a header. */
export const FreeTableSchema = z
  .object({
    ...ElementBase,
    kind: z.literal("table"),
    rows: z.array(z.array(z.string().max(200)).min(1).max(MAX_TABLE_COLS)).min(1).max(MAX_TABLE_ROWS),
    header: z.boolean().optional(),
    variant: z.enum(["lines", "striped", "grid"]).optional(),
    accent: ThemeRoleSchema.optional(),
    size: z.number().int().min(10).max(80).optional(),
  })
  .refine((t) => t.rows.every((r) => r.length === t.rows[0].length), { message: "Toutes les lignes ont le même nombre de cellules", path: ["rows"] });

export const CHART_TYPES = ["bar", "hbar", "line", "pie", "donut"] as const;
export type ChartType = (typeof CHART_TYPES)[number];
export const MAX_CHART_POINTS = 12;

/** A chart drawn from typed numbers (Task 78), in theme colours, as SVG (exports keep it). */
export const FreeChartSchema = z.object({
  ...ElementBase,
  kind: z.literal("chart"),
  chart: z.enum(CHART_TYPES),
  data: z
    .array(z.object({ label: z.string().max(40), value: z.number().finite().min(-1e9).max(1e9) }))
    .min(1)
    .max(MAX_CHART_POINTS),
  color: ThemeRoleSchema.optional(),
  showValues: z.boolean().optional(),
  unit: z.string().max(8).optional(),
});

export const VIDEO_PROVIDERS = ["youtube", "vimeo"] as const;
export type VideoProvider = (typeof VIDEO_PROVIDERS)[number];

/**
 * A YouTube or Vimeo video (Task 78). Only the provider and the video id are stored, never a
 * URL: the player address is built from them, so a slide cannot embed any other page.
 */
export const FreeVideoSchema = z.object({
  ...ElementBase,
  kind: z.literal("video"),
  provider: z.enum(VIDEO_PROVIDERS),
  videoId: z.string().regex(/^[A-Za-z0-9_-]{4,20}$/),
});

export const FreeElementSchema = z.discriminatedUnion("kind", [
  FreeTextSchema,
  FreeShapeSchema,
  FreeImageSchema,
  FreeIconSchema,
  FreeTableSchema,
  FreeChartSchema,
  FreeVideoSchema,
]);

export type FreeElement = z.infer<typeof FreeElementSchema>;
export type FreeText = z.infer<typeof FreeTextSchema>;
export type FreeShape = z.infer<typeof FreeShapeSchema>;
export type FreeImage = z.infer<typeof FreeImageSchema>;
export type FreeIcon = z.infer<typeof FreeIconSchema>;
export type FreeTable = z.infer<typeof FreeTableSchema>;
export type FreeChart = z.infer<typeof FreeChartSchema>;
export type FreeVideo = z.infer<typeof FreeVideoSchema>;

export const FreeContentShape = {
  elements: z.array(FreeElementSchema).max(MAX_FREE_ELEMENTS),
};
