import { describe, it, expect } from "vitest";
import { EditorHistory, changeGroup, type SlideSnapshot } from "@/components/app/editor/history";
import type { EditorSlide } from "@/components/app/editor/validation";

const snap = (title: string): SlideSnapshot => ({
  type: "cover",
  content: { title },
  layout: undefined,
  notes: "",
  script: "",
  cue: { objective: "", keyPoints: [], transition: "" } as unknown as SlideSnapshot["cue"],
});

/** A tiny deck: slide id → current snapshot, updated like the editor does. */
function deck(initial: Record<string, string>) {
  const state: Record<string, SlideSnapshot> = Object.fromEntries(Object.entries(initial).map(([id, t]) => [id, snap(t)]));
  const history = new EditorHistory(50, 1000);
  return {
    state,
    history,
    edit(id: string, title: string, group?: string, at = 0) {
      history.record(id, state[id], group, at);
      state[id] = snap(title);
    },
    travel(direction: "undo" | "redo") {
      const step = history[direction]((id) => state[id]);
      if (step) state[step.slideId] = step.snapshot;
      return step?.slideId ?? null;
    },
  };
}

describe("EditorHistory", () => {
  it("undoes and redoes across slides, in order", () => {
    const d = deck({ a: "A0", b: "B0" });
    d.edit("a", "A1");
    d.edit("b", "B1");
    expect(d.travel("undo")).toBe("b");
    expect(d.state.b.content).toEqual({ title: "B0" });
    expect(d.travel("undo")).toBe("a");
    expect(d.state.a.content).toEqual({ title: "A0" });
    expect(d.travel("undo")).toBeNull();
    expect(d.travel("redo")).toBe("a");
    expect(d.travel("redo")).toBe("b");
    expect(d.state).toMatchObject({ a: { content: { title: "A1" } }, b: { content: { title: "B1" } } });
  });

  it("merges quick changes of one group into one step, not slow ones or other groups", () => {
    const d = deck({ a: "" });
    d.edit("a", "H", "text:title", 0);
    d.edit("a", "He", "text:title", 300);
    d.edit("a", "Hey", "text:title", 600);
    d.edit("a", "Hey!", "text:title", 2000); // after a pause
    d.edit("a", "Hey!!", "text:subtitle", 2100); // another field
    d.travel("undo");
    expect(d.state.a.content).toEqual({ title: "Hey!" });
    d.travel("undo");
    expect(d.state.a.content).toEqual({ title: "Hey" });
    d.travel("undo");
    expect(d.state.a.content).toEqual({ title: "" });
  });

  it("never merges ungrouped changes and drops the redo branch on a new change", () => {
    const d = deck({ a: "0" });
    d.edit("a", "1", undefined, 0);
    d.edit("a", "2", undefined, 10);
    d.travel("undo");
    expect(d.state.a.content).toEqual({ title: "1" });
    expect(d.history.canRedo).toBe(true);
    d.edit("a", "x");
    expect(d.history.canRedo).toBe(false);
  });

  it("skips steps of deleted slides", () => {
    const d = deck({ a: "A0", b: "B0" });
    d.edit("a", "A1");
    d.edit("b", "B1");
    delete d.state.b;
    expect(d.travel("undo")).toBe("a");
  });

  it("keeps at most `limit` steps", () => {
    const h = new EditorHistory(3);
    for (let i = 0; i < 10; i++) h.record("a", snap(String(i)));
    let undone = 0;
    while (h.undo(() => snap("now"))) undone++;
    expect(undone).toBe(3);
  });
});

describe("changeGroup", () => {
  const slide = { id: "s", position: 0, type: "cover", content: { title: "a", subtitle: "b" }, notes: "", script: "", cue: {} } as unknown as EditorSlide;
  it("names the content keys and fields that change", () => {
    expect(changeGroup(slide, { content: { title: "x", subtitle: "b" } })).toBe("content.title");
    expect(changeGroup(slide, { notes: "n" })).toBe("notes");
    expect(changeGroup(slide, { notes: "n", content: { title: "a" } })).toBe("content.subtitle,notes");
  });
});

describe("rewrite targets (Task 79)", async () => {
  const { rewriteTarget } = await import("@/components/app/editor/rewrite-target");
  const slide = (type: string, content: Record<string, unknown>) =>
    ({ id: "s", position: 0, type, content, notes: "", script: "", cue: {} }) as unknown as EditorSlide;

  it("finds the text and its schema limit on structured slides", () => {
    const t = rewriteTarget(slide("problem", { headline: "Un titre", painPoints: [{ title: "Douleur", text: "Détail" }] }), "painPoints.0.title");
    expect(t).toEqual({ path: "painPoints.0.title", text: "Douleur", maxLength: 80, rich: false });
    expect(rewriteTarget(slide("problem", { headline: "" }), "headline")).toBeNull();
  });

  it("knows freeform texts (rich) and table cells", () => {
    const content = {
      elements: [
        { id: "a", kind: "text", style: "body", text: "Bonjour", x: 0, y: 0, w: 10, h: 10 },
        { id: "b", kind: "table", rows: [["A", "B"]], x: 0, y: 0, w: 10, h: 10 },
      ],
    };
    expect(rewriteTarget(slide("free", content), "elements.0.text")).toMatchObject({ maxLength: 600, rich: true });
    expect(rewriteTarget(slide("free", content), "elements.1.rows.0.1")).toMatchObject({ text: "B", maxLength: 200, rich: false });
  });
});
