import { notFound } from "next/navigation";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { DeckSchema, type Slide } from "@/lib/slides/schema";
import { layoutsFor } from "@/lib/slides/layouts";
import { systemThemes } from "@/lib/slides/theme";
import { SlidePreviewGrid } from "./SlidePreviewGrid";

export const metadata = { title: "Slides — GetFunnels (dev)", robots: { index: false } };

/**
 * Dev-only review surface for slide renderers and themes (Phase 6, Task 58).
 * /dev/slides?template=rdv-classique&theme=signature-violet&slides=0,3,7
 * Add &layouts=all to render each slide once per layout of its type (Task 59 review).
 */
export default async function DevSlidesPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string; theme?: string; slides?: string; layouts?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const params = await searchParams;
  const slug = (params.template ?? "rdv-classique").replace(/[^a-z0-9-]/g, "");
  const raw = JSON.parse(readFileSync(resolve(process.cwd(), "scripts/seed/templates", `${slug}.json`), "utf8"));
  const deck = DeckSchema.parse(raw);
  const theme = systemThemes.find((t) => t.id === params.theme) ?? systemThemes.find((t) => t.id === "signature-violet")!;
  const picks = params.slides?.split(",").map(Number).filter((n) => Number.isInteger(n));
  const picked = picks?.length ? picks.map((i) => deck.slides[i]).filter(Boolean) : deck.slides;
  const slides: Slide[] =
    params.layouts === "all"
      ? picked.flatMap((slide) =>
          layoutsFor(slide.type).map((layout) => ({ ...slide, id: `${slide.id}-${layout}`, layout }) as Slide)
        )
      : picked;

  return <SlidePreviewGrid slides={slides} theme={theme} />;
}
