import { describe, it, expect } from "vitest";
import { setContentPath } from "@/lib/slides/content-path";

describe("setContentPath", () => {
  const content = {
    headline: "Avant",
    painPoints: [
      { title: "A", text: "a" },
      { title: "B", text: "b" },
    ],
    cta: { label: "Go" },
    bullets: ["x", "y"],
  };

  it("sets a top-level field", () => {
    expect(setContentPath(content, "headline", "Après").headline).toBe("Après");
  });

  it("sets a field inside an array item without touching the others", () => {
    const next = setContentPath(content, "painPoints.1.title", "B2");
    expect(next.painPoints).toEqual([
      { title: "A", text: "a" },
      { title: "B2", text: "b" },
    ]);
  });

  it("sets nested object fields and plain array entries", () => {
    expect(setContentPath(content, "cta.label", "Réserver").cta).toEqual({ label: "Réserver" });
    expect(setContentPath(content, "bullets.0", "z").bullets).toEqual(["z", "y"]);
  });

  it("never mutates the input", () => {
    const snapshot = structuredClone(content);
    setContentPath(content, "painPoints.0.text", "changed");
    setContentPath(content, "cta.label", "changed");
    expect(content).toEqual(snapshot);
  });
});
