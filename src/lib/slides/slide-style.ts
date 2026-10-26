import { z } from "zod";
import { ThemeRoleSchema } from "./free";

/**
 * Per-slide look shared by every slide type (Tasks 73–74): an optional background and an
 * optional transition. Like `illustration`, they live in the slide's content JSON (no column)
 * and a slide without them renders exactly as before. Colours are theme roles, never hex, so a
 * theme switch recolours them.
 */

export const GRADIENT_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315] as const;

export const SlideBackgroundSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("color"), color: ThemeRoleSchema }),
  z.object({
    kind: z.literal("gradient"),
    from: ThemeRoleSchema,
    to: ThemeRoleSchema,
    angle: z.number().int().min(0).max(359),
  }),
  z.object({
    kind: z.literal("image"),
    assetId: z.string().uuid().optional(),
    /** Veil of the theme's background colour over the image, so the theme's text stays readable. */
    overlay: z.number().min(0).max(0.9),
  }),
]);
export type SlideBackground = z.infer<typeof SlideBackgroundSchema>;
export type SlideBackgroundKind = SlideBackground["kind"];

export const SLIDE_TRANSITIONS = ["fade", "slide", "zoom", "none"] as const;
export const SlideTransitionSchema = z.enum(SLIDE_TRANSITIONS);
export type SlideTransition = z.infer<typeof SlideTransitionSchema>;

/** Default of each background kind when the user switches to it. */
export function defaultBackground(kind: SlideBackgroundKind): SlideBackground {
  switch (kind) {
    case "color":
      return { kind, color: "surface" };
    case "gradient":
      // Subtle by default: the theme's text stays readable on both ends.
      return { kind, from: "bg", to: "surface", angle: 135 };
    case "image":
      return { kind, overlay: 0.45 };
  }
}
