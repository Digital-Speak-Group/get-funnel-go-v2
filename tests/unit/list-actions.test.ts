import { describe, it, expect } from "vitest";
import { applyListAction, canApply, listBounds } from "@/components/app/editor/list-actions";

const pains = (n: number) => Array.from({ length: n }, (_, i) => ({ title: `P${i}`, text: `t${i}` }));
const titles = (content: Record<string, unknown> | null) =>
  (content?.painPoints as { title: string }[] | undefined)?.map((p) => p.title);

describe("listBounds", () => {
  it("reads min/max from the slide type's schema", () => {
    expect(listBounds("problem", "painPoints")).toEqual({ min: 3, max: 5 });
    expect(listBounds("architecture", "layers")).toEqual({ min: 2, max: 5 });
  });

  it("steps into items for nested lists", () => {
    expect(listBounds("architecture", "layers.1.items")).toEqual({ min: 1, max: 6 });
  });

  it("is unbounded for paths that are not lists", () => {
    expect(listBounds("problem", "headline")).toEqual({ min: 0, max: Infinity });
  });
});

describe("applyListAction", () => {
  const content = { headline: "H", painPoints: pains(4) };

  it("moves an item before or after its neighbour", () => {
    expect(titles(applyListAction("problem", content, "painPoints", "before", 2))).toEqual(["P0", "P2", "P1", "P3"]);
    expect(titles(applyListAction("problem", content, "painPoints", "after", 0))).toEqual(["P1", "P0", "P2", "P3"]);
  });

  it("duplicates an item right after itself, as an independent copy", () => {
    const next = applyListAction("problem", content, "painPoints", "duplicate", 1)!;
    expect(titles(next)).toEqual(["P0", "P1", "P1", "P2", "P3"]);
    const list = next.painPoints as object[];
    expect(list[2]).not.toBe(list[1]);
  });

  it("removes an item", () => {
    expect(titles(applyListAction("problem", content, "painPoints", "remove", 0))).toEqual(["P1", "P2", "P3"]);
  });

  it("refuses actions that break the schema limits or fall off the ends", () => {
    expect(applyListAction("problem", { painPoints: pains(5) }, "painPoints", "duplicate", 0)).toBeNull();
    expect(applyListAction("problem", { painPoints: pains(3) }, "painPoints", "remove", 0)).toBeNull();
    expect(applyListAction("problem", content, "painPoints", "before", 0)).toBeNull();
    expect(applyListAction("problem", content, "painPoints", "after", 3)).toBeNull();
    expect(applyListAction("problem", content, "painPoints", "remove", 9)).toBeNull();
  });

  it("works on nested lists without touching the rest", () => {
    const arch = { headline: "A", layers: [{ name: "L0", items: ["a", "b"] }, { name: "L1", items: ["c"] }] };
    const next = applyListAction("architecture", arch, "layers.0.items", "remove", 0)!;
    expect(next.layers).toEqual([{ name: "L0", items: ["b"] }, { name: "L1", items: ["c"] }]);
    expect(applyListAction("architecture", arch, "layers.1.items", "remove", 0)).toBeNull();
    expect(arch.layers[0].items).toEqual(["a", "b"]);
  });

  it("canApply matches the bounds", () => {
    expect(canApply("duplicate", 0, 5, { min: 3, max: 5 })).toBe(false);
    expect(canApply("remove", 0, 3, { min: 3, max: 5 })).toBe(false);
    expect(canApply("remove", 0, 4, { min: 3, max: 5 })).toBe(true);
  });
});
