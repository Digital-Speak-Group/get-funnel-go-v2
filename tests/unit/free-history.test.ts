import { describe, it, expect } from "vitest";
import { FreeHistory } from "@/components/app/editor/free/history";
import type { FreeElement } from "@/lib/slides/free";

const state = (x: number): FreeElement[] => [{ id: "00000000-0000-4000-8000-000000000001", kind: "shape", shape: "rect", x, y: 0, w: 10, h: 10 }];

describe("FreeHistory", () => {
  it("undoes and redoes in order", () => {
    const h = new FreeHistory();
    h.record(state(0)); // 0 → 1
    h.record(state(1)); // 1 → 2
    expect(h.undo(state(2))).toEqual(state(1));
    expect(h.undo(state(1))).toEqual(state(0));
    expect(h.undo(state(0))).toBeNull();
    expect(h.redo(state(0))).toEqual(state(1));
    expect(h.redo(state(1))).toEqual(state(2));
    expect(h.redo(state(2))).toBeNull();
  });

  it("drops the redo branch on a new change", () => {
    const h = new FreeHistory();
    h.record(state(0));
    h.undo(state(1));
    expect(h.canRedo).toBe(true);
    h.record(state(0));
    expect(h.canRedo).toBe(false);
  });

  it("keeps at most `limit` steps", () => {
    const h = new FreeHistory(3);
    for (let i = 0; i < 10; i++) h.record(state(i));
    let undone = 0;
    while (h.undo(state(99))) undone++;
    expect(undone).toBe(3);
  });
});
