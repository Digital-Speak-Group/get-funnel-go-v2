import { parseScriptCue, type ScriptCue } from "@/lib/slides/schema";

/** The cue as the editor's inputs hold it: plain strings, tips one per line. */
export interface EditorCue {
  punchline: string;
  tag: string;
  durationSec: string;
  transition: string;
  bullets: string;
  closing: string;
}

export const EMPTY_EDITOR_CUE: EditorCue = {
  punchline: "",
  tag: "",
  durationSec: "",
  transition: "",
  bullets: "",
  closing: "",
};

export function toEditorCue(raw: unknown): EditorCue {
  const cue = parseScriptCue(raw);
  if (!cue) return EMPTY_EDITOR_CUE;
  return {
    punchline: cue.punchline ?? "",
    tag: cue.tag ?? "",
    durationSec: cue.durationSec === undefined ? "" : String(cue.durationSec),
    transition: cue.transition ?? "",
    bullets: (cue.bullets ?? []).join("\n"),
    closing: cue.closing ?? "",
  };
}

/**
 * Editor inputs → cue to validate and save. Blank inputs are dropped; an all-blank cue is
 * `null` (the slide has a plain script). A non-numeric duration is kept as NaN so schema
 * validation reports it on `cue.durationSec` instead of silently clearing it.
 */
export function toScriptCue(cue: EditorCue): ScriptCue | null {
  const text = (value: string) => value.trim() || undefined;
  const duration = cue.durationSec.trim();
  const bullets = cue.bullets
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const out: ScriptCue = {
    punchline: text(cue.punchline),
    tag: text(cue.tag),
    durationSec: duration ? Number(duration) : undefined,
    transition: text(cue.transition),
    bullets: bullets.length > 0 ? bullets : undefined,
    closing: text(cue.closing),
  };
  const entries = Object.entries(out).filter(([, value]) => value !== undefined);
  return entries.length > 0 ? (Object.fromEntries(entries) as ScriptCue) : null;
}
