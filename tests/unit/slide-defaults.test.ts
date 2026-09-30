import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { SLIDE_TYPES, SlideSchema } from "@/lib/slides/schema";
import { buildDefaultContent } from "@/lib/slides/defaults";

describe("buildDefaultContent", () => {
  for (const type of SLIDE_TYPES) {
    it(`produces schema-valid content for "${type}"`, () => {
      const content = buildDefaultContent(type);
      const result = SlideSchema.safeParse({
        id: randomUUID(),
        position: 0,
        type,
        content,
        notes: "",
        script: "",
      });
      if (!result.success) {
        throw new Error(
          `${type}: ${JSON.stringify(result.error.issues, null, 2)}`
        );
      }
      expect(result.success).toBe(true);
    });
  }

  it("includes required cover fields", () => {
    const content = buildDefaultContent("cover");
    expect(typeof content.title).toBe("string");
  });

  it("omits optional fields instead of filling them with placeholders", () => {
    const content = buildDefaultContent("cover");
    expect("kicker" in content).toBe(false);
    expect("subtitle" in content).toBe(false);
  });

  it("creates array fields at their minimum length", () => {
    const content = buildDefaultContent("problem");
    const painPoints = content.painPoints as unknown[];
    expect(painPoints).toHaveLength(3);
  });
});
