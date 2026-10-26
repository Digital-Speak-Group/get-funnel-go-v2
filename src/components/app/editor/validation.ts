import { SlideSchema, slideContentSchemas, type ScriptCue, type SlideType } from "@/lib/slides/schema";
import { groupIssues, normalizeContent, type FieldErrors } from "./field-schema";
import { toScriptCue, type EditorCue } from "./cue";

export interface EditorSlide {
  id: string;
  position: number;
  type: SlideType;
  content: Record<string, unknown>;
  notes: string;
  script: string;
  cue: EditorCue;
  /** Layout variant (Task 59); undefined = the type's original layout. */
  layout?: string;
}

export interface SavePayload {
  slideId: string;
  type: SlideType;
  content: Record<string, unknown>;
  notes: string;
  script: string;
  cue: ScriptCue | null;
  layout: string | null;
}

export function validateEditorSlide(slide: EditorSlide): FieldErrors {
  const content = normalizeContent(
    slideContentSchemas[slide.type],
    slide.content
  );
  const result = SlideSchema.safeParse({
    id: slide.id,
    position: slide.position,
    type: slide.type,
    content,
    notes: slide.notes,
    script: slide.script,
    cue: toScriptCue(slide.cue) ?? undefined,
    layout: slide.layout,
  });
  if (result.success) return {};

  const grouped = groupIssues(result.error.issues);
  const out: FieldErrors = {};
  for (const [key, messages] of Object.entries(grouped)) {
    const cleaned = key.startsWith("content.")
      ? key.slice("content.".length)
      : key;
    out[cleaned] = messages;
  }
  return out;
}

export function buildSavePayload(slide: EditorSlide): SavePayload {
  return {
    slideId: slide.id,
    type: slide.type,
    content: normalizeContent(
      slideContentSchemas[slide.type],
      slide.content
    ) as Record<string, unknown>,
    notes: slide.notes,
    script: slide.script,
    cue: toScriptCue(slide.cue),
    layout: slide.layout ?? null,
  };
}
