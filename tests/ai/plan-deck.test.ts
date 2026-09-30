import { describe, it, expect, vi } from "vitest";
import { planDeck } from "@/server/ai/stages/planDeck";
import type { AIProvider } from "@/lib/ai/provider";

describe("Stage 2: planDeck", () => {
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

  const dummyTemplate = {
    id: "vsl",
    name: "VSL",
    stages: ["Intro", "Problem", "Solution", "CTA"],
  };

  it("returns a plan of requested slide length", async () => {
    vi.mocked(mockProvider.complete).mockResolvedValueOnce({
      success: true,
      data: {
        plan: [
          { type: "cover", headline: "Intro", purpose: "Start" },
          { type: "problem", headline: "Problem", purpose: "Pain" },
          { type: "why", headline: "Solution", purpose: "Why it works" },
          { type: "cta", headline: "CTA", purpose: "End" },
        ],
      },
      usage: { inputTokens: 10, outputTokens: 10, model: "test", costCents: 0 },
    });

    const result = await planDeck(mockProvider, dummyBrief, dummyTemplate, { slideCount: 4 });
    
    expect(result.plan).toHaveLength(4);
    expect(result.plan[0].type).toBe("cover");
    expect(mockProvider.complete).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.stringContaining("expert presentation architect"),
      })
    );
  });

  it("throws if provider fails", async () => {
    vi.mocked(mockProvider.complete).mockResolvedValueOnce({
      success: false,
      error: "Provider error",
    });

    await expect(
      planDeck(mockProvider, dummyBrief, dummyTemplate, { slideCount: 10 })
    ).rejects.toThrow("Failed to plan deck: Provider error");
  });
});
