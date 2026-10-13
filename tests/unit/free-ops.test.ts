import { describe, it, expect } from "vitest";
import {
  addElement,
  alignElements,
  clampToCanvas,
  duplicateElements,
  makeElement,
  nudgeElements,
  reorderElements,
  removeElements,
  updateElements,
} from "@/components/app/editor/free/free-ops";
import { FreeElementSchema, type FreeElement } from "@/lib/slides/free";

const box = (id: string, x = 100, y = 100, w = 200, h = 100): FreeElement => ({
  id,
  kind: "shape",
  shape: "rect",
  x,
  y,
  w,
  h,
});
const ids = (elements: FreeElement[]) => elements.map((e) => e.id);

describe("makeElement", () => {
  it("creates valid, centred elements of every kind", () => {
    for (const kind of ["text", "rect", "ellipse", "line", "image", "icon"] as const) {
      const element = makeElement(kind);
      expect(FreeElementSchema.safeParse(element).success).toBe(true);
      expect(element.x + element.w / 2).toBeCloseTo(960, -1);
    }
  });
});

describe("element operations", () => {
  const els = [box("a"), box("b"), box("c")];

  it("adds up to the 60-element limit", () => {
    expect(addElement(els, box("d"))).toHaveLength(4);
    expect(addElement(Array.from({ length: 60 }, (_, i) => box(`e${i}`)), box("x"))).toBeNull();
  });

  it("updates, removes and nudges only the selection", () => {
    expect(updateElements(els, ["b"], (e) => ({ ...e, w: 500 })).map((e) => e.w)).toEqual([200, 500, 200]);
    expect(ids(removeElements(els, ["a", "c"]))).toEqual(["b"]);
    expect(nudgeElements(els, ["c"], 10, -5)[2]).toMatchObject({ x: 110, y: 95 });
  });

  it("duplicates on top, offset, with new ids", () => {
    const result = duplicateElements(els, ["a"])!;
    expect(result.elements).toHaveLength(4);
    expect(result.elements[3]).toMatchObject({ x: 124, y: 124, w: 200 });
    expect(result.ids).toEqual([result.elements[3].id]);
    expect(result.ids[0]).not.toBe("a");
  });

  it("changes layer order", () => {
    expect(ids(reorderElements(els, ["a"], "front"))).toEqual(["b", "c", "a"]);
    expect(ids(reorderElements(els, ["c"], "back"))).toEqual(["c", "a", "b"]);
    expect(ids(reorderElements(els, ["a"], "forward"))).toEqual(["b", "a", "c"]);
    expect(ids(reorderElements(els, ["c"], "backward"))).toEqual(["a", "c", "b"]);
    expect(ids(reorderElements(els, ["c"], "forward"))).toEqual(["a", "b", "c"]);
  });

  it("aligns a single element to the canvas and several to their bounds", () => {
    expect(alignElements([box("a")], ["a"], "center")[0].x).toBe(860);
    expect(alignElements([box("a")], ["a"], "bottom")[0].y).toBe(980);
    const two = [box("a", 100, 100), box("b", 500, 300, 100, 50)];
    expect(alignElements(two, ["a", "b"], "right").map((e) => e.x)).toEqual([400, 500]);
    expect(alignElements(two, ["a", "b"], "top").map((e) => e.y)).toEqual([100, 100]);
  });

  it("keeps at least part of an element on the canvas", () => {
    expect(clampToCanvas(box("a", -5000, 5000))).toMatchObject({ x: -160, y: 1040 });
    const inside = box("a");
    expect(clampToCanvas(inside)).toBe(inside);
  });
});
