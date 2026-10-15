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
import {
  distributeElements,
  expandToGroups,
  groupElements,
  pasteElements,
  setLocked,
  ungroupElements,
  unlockedIds,
} from "@/components/app/editor/free/selection-ops";
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
    for (const kind of ["text", "rect", "ellipse", "line", "triangle", "diamond", "arrow", "star", "bubble", "image", "icon"] as const) {
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

describe("selection operations (Task 70)", () => {
  const els = [box("a", 0, 0, 100, 100), box("b", 300, 0, 100, 100), box("c", 1000, 0, 100, 100)];

  it("groups, expands a selection to its group, and ungroups", () => {
    const grouped = groupElements(els, ["a", "b"])!;
    expect(grouped[0].groupId).toBeDefined();
    expect(grouped[0].groupId).toBe(grouped[1].groupId);
    expect(grouped[2].groupId).toBeUndefined();
    expect(expandToGroups(grouped, ["a"])).toEqual(["a", "b"]);
    expect(groupElements(els, ["a"])).toBeNull();
    const ungrouped = ungroupElements(grouped, ["b"])!;
    expect(ungrouped.every((e) => e.groupId === undefined)).toBe(true);
    expect(ungroupElements(els, ["a"])).toBeNull();
  });

  it("locks and unlocks, and locked elements are not movable", () => {
    const locked = setLocked(els, ["a"], true);
    expect(locked[0].locked).toBe(true);
    expect(unlockedIds(locked, ["a", "b"])).toEqual(["b"]);
    expect("locked" in setLocked(locked, ["a"], false)[0]).toBe(false);
  });

  it("distributes 3+ unlocked elements with equal gaps, outer ones fixed", () => {
    const result = distributeElements(els, ["a", "b", "c"], "horizontal")!;
    expect(result.map((e) => e.x)).toEqual([0, 500, 1000]);
    expect(distributeElements(els, ["a", "b"], "horizontal")).toBeNull();
    expect(distributeElements(setLocked(els, ["b"], true), ["a", "b", "c"], "vertical")).toBeNull();
  });

  it("pastes copies with new ids and new group ids, shifted", () => {
    const grouped = groupElements(els, ["a", "b"])!;
    const pasted = pasteElements(grouped, grouped.slice(0, 2), 24)!;
    expect(pasted.elements).toHaveLength(5);
    const [p1, p2] = pasted.elements.slice(3);
    expect(pasted.ids).toEqual([p1.id, p2.id]);
    expect(p1.id).not.toBe("a");
    expect(p1.x).toBe(24);
    expect(p1.groupId).toBe(p2.groupId);
    expect(p1.groupId).not.toBe(grouped[0].groupId);
  });

  it("duplicates a group into a new group", () => {
    const grouped = groupElements(els, ["a", "b"])!;
    const copy = duplicateElements(grouped, ["a", "b"])!;
    const copies = copy.elements.slice(3);
    expect(copies[0].groupId).toBe(copies[1].groupId);
    expect(copies[0].groupId).not.toBe(grouped[0].groupId);
  });
});
