import { describe, it, expect } from "vitest";
import { z } from "zod";
import { toToolSchema } from "@/lib/ai/tool-schema";
import { BriefSchema, SlidePlanSchema } from "@/server/ai/schema";
import { SlideSchema } from "@/lib/slides/schema";

describe("toToolSchema", () => {
  it("describes the brief's fields instead of an empty schema", () => {
    const { parameters } = toToolSchema(BriefSchema);

    expect(parameters.type).toBe("object");
    expect(Object.keys(parameters.properties as object)).toEqual(
      expect.arrayContaining(["offer", "audience", "pains", "proof", "cta", "tone", "language", "confidence"])
    );
    expect(parameters).not.toHaveProperty("$schema");
  });

  it("describes plan items with type, headline and purpose", () => {
    const { parameters } = toToolSchema(z.object({ plan: z.array(SlidePlanSchema) }));
    const plan = (parameters.properties as Record<string, { items: { properties: object } }>).plan;

    expect(Object.keys(plan.items.properties)).toEqual(["type", "headline", "purpose"]);
  });

  it("passes object arguments through unchanged", () => {
    const { unwrap } = toToolSchema(BriefSchema);
    expect(unwrap({ offer: "x" })).toEqual({ offer: "x" });
  });

  it("wraps the slide union in an object and unwraps the model's reply", () => {
    const { parameters, unwrap } = toToolSchema(SlideSchema);

    expect(parameters.type).toBe("object");
    expect(parameters.required).toEqual(["value"]);
    const inner = (parameters.properties as Record<string, Record<string, unknown>>).value;
    expect(inner.anyOf ?? inner.oneOf).toBeDefined();

    expect(unwrap({ value: { type: "cover" } })).toEqual({ type: "cover" });
  });
});
