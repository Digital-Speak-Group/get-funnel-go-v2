import { SLIDE_TYPES } from "@/lib/slides/schema";
import { systemThemes } from "@/lib/slides/theme";

/**
 * The legacy funnel frameworks shipped as templates (docs/spec.md, decision 8), in display
 * order. Each slug is a file in scripts/seed/templates; the theme is the one its `themeId`
 * points to (scripts/seed/themes.ts → SYSTEM_THEME_IDS).
 */
export const FRAMEWORK_TEMPLATES = [
  { slug: "rdv-classique", themeId: "signature-violet" },
  { slug: "lancement-orchestre", themeId: "signature-lancement" },
  { slug: "vsl-funnel", themeId: "signature-vsl" },
  { slug: "tunnel-webinaire", themeId: "signature-webinaire" },
  { slug: "evergreen", themeId: "signature-evergreen" },
  { slug: "tunnel-pay", themeId: "signature-pay" },
  { slug: "pitch-commercial", themeId: "signature-violet" },
] as const;

/** Bounds of the generate request (src/app/api/ai/generate/route.ts) and of DeckSchema. */
const SCRIPT_MIN_CHARS = 300;
const SCRIPT_MAX_CHARS = 30000;
const MIN_SLIDES = 5;
const MAX_SLIDES = 40;

const formatNumber = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

/**
 * Verifiable numbers for the marketing pages, counted from the code rather than written by
 * hand, so the landing cannot drift from the product.
 */
export const marketingFacts = {
  frameworks: FRAMEWORK_TEMPLATES.length,
  slideTypes: SLIDE_TYPES.length,
  themes: systemThemes.length,
  minSlides: MIN_SLIDES,
  maxSlides: MAX_SLIDES,
  scriptMin: formatNumber(SCRIPT_MIN_CHARS),
  scriptMax: formatNumber(SCRIPT_MAX_CHARS),
};
