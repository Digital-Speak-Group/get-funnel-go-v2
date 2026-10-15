import { describe, it, expect } from "vitest";
import { navigate, type PresenterPosition } from "@/components/presenter/navigation";
import { revealSteps, revealedUpTo } from "@/lib/slides/reveal";

// Slide 1 has two build steps, the others none.
const steps = (i: number) => (i === 1 ? 2 : 0);
const go = (p: PresenterPosition, move: Parameters<typeof navigate>[1]) => navigate(p, move, 3, steps);

describe("presenter navigation with build steps", () => {
  it("reveals the steps before moving on, and hides them going back", () => {
    let p: PresenterPosition = { index: 0, step: 0 };
    const seen: string[] = [];
    for (let i = 0; i < 5; i++) {
      p = go(p, "next");
      seen.push(`${p.index}:${p.step}`);
    }
    expect(seen).toEqual(["1:0", "1:1", "1:2", "2:0", "2:0"]);
    p = go(p, "previous");
    expect(p).toEqual({ index: 1, step: 2 }); // back onto the built slide
    p = go(go(go(p, "previous"), "previous"), "previous");
    expect(p).toEqual({ index: 0, step: 0 });
    expect(go(p, "previous")).toEqual({ index: 0, step: 0 });
  });

  it("jumps land on a slide with nothing revealed", () => {
    expect(go({ index: 0, step: 0 }, { goTo: 1 })).toEqual({ index: 1, step: 0 });
    expect(go({ index: 1, step: 2 }, { goTo: 1 })).toEqual({ index: 1, step: 2 });
    expect(go({ index: 1, step: 1 }, "last")).toEqual({ index: 2, step: 0 });
    expect(go({ index: 2, step: 0 }, { goTo: 99 })).toEqual({ index: 2, step: 0 });
  });
});

describe("reveal steps", () => {
  const el = (step?: number) => ({ id: "x", kind: "shape", shape: "rect", x: 0, y: 0, w: 10, h: 10, ...(step ? { reveal: { step, effect: "fade" } } : {}) });
  it("lists the distinct steps of a freeform slide, in order", () => {
    expect(revealSteps({ type: "free", content: { elements: [el(3), el(), el(1), el(3)] } })).toEqual([1, 3]);
    expect(revealSteps({ type: "cover", content: { title: "x" } })).toEqual([]);
  });
  it("maps a number of presses to the visible step value", () => {
    expect(revealedUpTo([1, 3], 0)).toBe(0);
    expect(revealedUpTo([1, 3], 1)).toBe(1);
    expect(revealedUpTo([1, 3], 2)).toBe(Infinity);
  });
});
