import { describe, it, expect, vi } from "vitest";
import { generateSlides } from "@/server/ai/stages/generateSlides";
import type { AIProvider } from "@/lib/ai/provider";
import type { SlidePlan } from "@/server/ai/schema";
import { buildDefaultContent } from "@/lib/slides/defaults";

describe("Stage 3: generateSlides", () => {
  const mockProvider: AIProvider = {
    complete: vi.fn(),
  };

  const dummyBrief = {
    offer: "A magical wand",
    audience: "Wizards",
    pains: ["Hard to cast spells"],
    proof: ["Merlin loves it"],
    cta: "Buy now",
    tone: "professional",
    language: "en",
    confidence: 1.0,
  } as any;

  const dummyPlan: SlidePlan[] = [
    { type: "cover", headline: "Intro", purpose: "Start" },
    { type: "problem", headline: "Problem", purpose: "Pain" },
    { type: "cta", headline: "CTA", purpose: "End" },
  ];

  it("generates a slide for each plan item in parallel", async () => {
    vi.mocked(mockProvider.complete).mockImplementation(async (args) => {
      // Return a valid slide matching whatever type was requested
      const planItem = dummyPlan.find(p => args.input.includes(`Type: ${p.type}`));
      if (!planItem) throw new Error("Unknown type requested");

      return {
        success: true,
        data: { type: planItem.type, content: buildDefaultContent(planItem.type) },
        usage: { inputTokens: 10, outputTokens: 10, model: "test", costCents: 1 },
      } as any; // Cast as any because we aren't filling full schema constraints in mock
    });

    const result = await generateSlides(mockProvider, "script", dummyBrief, dummyPlan);
    
    expect(result.slides).toHaveLength(3);
    expect(result.failures).toBe(0);
    expect(result.usage.costCents).toBe(3);
    
    // Check positions are sequential
    expect(result.slides[0].position).toBe(0);
    expect(result.slides[1].position).toBe(1);
    expect(result.slides[2].position).toBe(2);
  });

  it("strips <SCRIPT> tags and drops a dump of the whole raw script", async () => {
    const source = Array.from({ length: 12 }, (_, i) => `Section ${i + 1} : le marché de la nicotine évolue vite.`).join("\n");
    vi.mocked(mockProvider.complete).mockImplementation(async (args) => {
      const planItem = dummyPlan.find(p => args.input.includes(`Type: ${p.type}`))!;
      const script = {
        cover: "<SCRIPT>Bonjour à tous.</SCRIPT>",
        problem: `<SCRIPT>\n${source}\n</SCRIPT>`,
        cta: "Réservez votre appel.",
      }[planItem.type as "cover" | "problem" | "cta"];
      return {
        success: true,
        data: { type: planItem.type, content: buildDefaultContent(planItem.type), script },
        usage: { inputTokens: 10, outputTokens: 10, model: "test", costCents: 1 },
      } as any;
    });

    const { slides } = await generateSlides(mockProvider, source, dummyBrief, dummyPlan);

    expect(slides.map(s => s.script)).toEqual(["Bonjour à tous.", undefined, "Réservez votre appel."]);
  });

  it("survives individual slide failures", async () => {
    vi.mocked(mockProvider.complete).mockImplementation(async (args) => {
      if (args.input.includes(`Type: problem`)) {
        return { success: false, error: "Validation failed twice" };
      }
      return {
        success: true,
        data: { type: "cover", content: buildDefaultContent("cover") },
        usage: { inputTokens: 10, outputTokens: 10, model: "test", costCents: 1 },
      } as any;
    });

    const result = await generateSlides(mockProvider, "script", dummyBrief, dummyPlan);
    
    expect(result.slides).toHaveLength(2); // Problem failed, 2 remain
    expect(result.failures).toBe(1);
    
    // Check positions are re-indexed
    expect(result.slides[0].position).toBe(0);
    expect(result.slides[1].position).toBe(1);
  });
});
