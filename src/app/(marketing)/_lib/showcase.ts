import "server-only";
import { DeckSchema, type Slide } from "@/lib/slides/schema";
import { systemThemes, type ThemeTokens } from "@/lib/slides/theme";
import { FRAMEWORK_TEMPLATES } from "./facts";
import rdvClassique from "../../../../scripts/seed/templates/rdv-classique.json";
import lancementOrchestre from "../../../../scripts/seed/templates/lancement-orchestre.json";
import vslFunnel from "../../../../scripts/seed/templates/vsl-funnel.json";
import tunnelWebinaire from "../../../../scripts/seed/templates/tunnel-webinaire.json";
import evergreen from "../../../../scripts/seed/templates/evergreen.json";
import tunnelPay from "../../../../scripts/seed/templates/tunnel-pay.json";
import pitchCommercial from "../../../../scripts/seed/templates/pitch-commercial.json";

/**
 * Real template content for the marketing pages, read on the server at build time. Only the
 * slides a section shows reach the client, stripped of scripts unless the section needs them.
 */
const RAW_TEMPLATES: Record<(typeof FRAMEWORK_TEMPLATES)[number]["slug"], unknown> = {
  "rdv-classique": rdvClassique,
  "lancement-orchestre": lancementOrchestre,
  "vsl-funnel": vslFunnel,
  "tunnel-webinaire": tunnelWebinaire,
  evergreen,
  "tunnel-pay": tunnelPay,
  "pitch-commercial": pitchCommercial,
};

type TemplateMeta = { name: string; category: string; description: string };

function themeById(id: string): ThemeTokens {
  const theme = systemThemes.find((t) => t.id === id);
  if (!theme) throw new Error(`Marketing showcase: unknown system theme "${id}"`);
  return theme;
}

/** Visual-only copy of a slide: what the renderer needs, without presenter material. */
function visual(slide: Slide): Slide {
  return { ...slide, script: undefined, notes: undefined, cue: undefined } as Slide;
}

const templates = FRAMEWORK_TEMPLATES.map(({ slug, themeId }) => {
  const raw = RAW_TEMPLATES[slug] as TemplateMeta;
  const deck = DeckSchema.parse(raw);
  return { slug, name: raw.name, category: raw.category, description: raw.description, theme: themeById(themeId), deck };
});

export interface FrameworkCard {
  slug: string;
  name: string;
  category: string;
  slideCount: number;
  theme: ThemeTokens;
  cover: Slide;
}

export const frameworkCards: FrameworkCard[] = templates.map((t) => ({
  slug: t.slug,
  name: t.name,
  category: t.category,
  slideCount: t.deck.slides.length,
  theme: t.theme,
  cover: visual(t.deck.slides[0]),
}));

const rdv = templates[0];

/** Hero preview: a walk through RDV Classique, skipping slides that need uploaded assets. */
const HERO_SLIDES = [0, 1, 3, 7, 10, 17, 21];

export const heroShowcase = {
  templateName: rdv.name,
  theme: rdv.theme,
  slides: HERO_SLIDES.map((i) => visual(rdv.deck.slides[i])),
};

/** Presenter demo: slide 4 of RDV Classique ("DOULEUR") with its real script and cue. */
const PRESENTER_INDEX = 3;
/** Seconds spent on the slides so far in the demo (ahead of the current slide, on pace). */
const DEMO_SLIDE_SECONDS = [44, 118, 86, 52];

export const presenterShowcase = {
  theme: rdv.theme,
  index: PRESENTER_INDEX,
  total: rdv.deck.slides.length,
  current: rdv.deck.slides[PRESENTER_INDEX],
  currentVisual: visual(rdv.deck.slides[PRESENTER_INDEX]),
  nextVisual: visual(rdv.deck.slides[PRESENTER_INDEX + 1]),
  /** First slides of the deck with their cues, for the pace panel. */
  paceSlides: rdv.deck.slides.slice(0, 6).map((s) => ({ ...s, script: undefined, notes: undefined }) as Slide),
  slideSeconds: DEMO_SLIDE_SECONDS,
  elapsedSec: DEMO_SLIDE_SECONDS.reduce((sum, s) => sum + s, 0),
};
