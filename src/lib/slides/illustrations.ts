import { z } from "zod";

/**
 * Decorative illustrations a slide can carry (Task 61): the legacy animated SVGs plus the
 * Signature diagrams. Purely visual: a slide renders the same without one, and they are drawn
 * with the deck theme's colours.
 */
export const ILLUSTRATIONS = [
  "funnel",
  "automation",
  "dashboard",
  "datastream",
  "network",
  "orbit",
  "target",
  "shapes",
  "wave",
  "radar",
  "packets",
  "honeycomb",
] as const;

export type IllustrationName = (typeof ILLUSTRATIONS)[number];

export const IllustrationSchema = z.enum(ILLUSTRATIONS);
