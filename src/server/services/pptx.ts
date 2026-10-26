import "server-only";
import PptxGenJS from "pptxgenjs";
import type { ScriptCue } from "@/lib/slides/schema";
import { captureSlides } from "./slide-capture";

/**
 * Deck → PowerPoint: each slide is a full-bleed 1920×1080 picture of the audience view
 * (pixel-identical to the app and the PDF, not editable), with the presenter material
 * as speaker notes.
 */

export const NOTES_LABELS = {
  punchline: "Accroche",
  tips: "Conseils",
  transition: "Transition",
  closing: "Conclusion",
  notes: "Notes",
} as const;

export interface PresenterMaterial {
  script?: string | null;
  notes?: string | null;
  cue?: ScriptCue;
}

function formatDuration(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  if (min === 0) return `${sec} s`;
  return sec === 0 ? `${min} min` : `${min} min ${String(sec).padStart(2, "0")}`;
}

/** Speaker notes in the order the presenter panel shows them; empty parts are left out. */
export function speakerNotes({ script, notes, cue }: PresenterMaterial): string {
  const header = [cue?.tag, cue?.durationSec ? formatDuration(cue.durationSec) : undefined]
    .filter(Boolean)
    .join(" · ");
  const tips = cue?.bullets?.length
    ? `${NOTES_LABELS.tips} :\n${cue.bullets.map((b) => `- ${b}`).join("\n")}`
    : undefined;

  return [
    header ? `[${header}]` : undefined,
    cue?.punchline ? `${NOTES_LABELS.punchline} : ${cue.punchline}` : undefined,
    script?.trim(),
    tips,
    cue?.transition ? `${NOTES_LABELS.transition} : ${cue.transition}` : undefined,
    cue?.closing ? `${NOTES_LABELS.closing} : ${cue.closing}` : undefined,
    notes?.trim() ? `${NOTES_LABELS.notes} : ${notes.trim()}` : undefined,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export async function buildPptx(
  title: string,
  slides: { image: Buffer; material: PresenterMaterial }[]
): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";
  pptx.title = title;

  for (const { image, material } of slides) {
    const slide = pptx.addSlide();
    slide.addImage({ data: `image/png;base64,${image.toString("base64")}`, x: 0, y: 0, w: "100%", h: "100%" });
    const notes = speakerNotes(material);
    if (notes) slide.addNotes(notes);
  }

  return (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
}

export async function renderDeckPptx(
  appUrl: string,
  presentToken: string,
  title: string,
  slides: { index: number; material: PresenterMaterial }[]
): Promise<Buffer> {
  const images = await captureSlides(
    appUrl,
    presentToken,
    slides.map((s) => s.index),
    async (page) => Buffer.from(await page.screenshot({ type: "png" }))
  );
  return buildPptx(
    title,
    slides.map((s, i) => ({ image: images[i], material: s.material }))
  );
}
