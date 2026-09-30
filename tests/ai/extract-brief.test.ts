import { describe, it, expect, vi } from "vitest";
import { extractBrief } from "@/server/ai/stages/extractBrief";
import type { AIProvider } from "@/lib/ai/provider";

describe("Stage 1: extractBrief", () => {
  const mockProvider: AIProvider = {
    complete: vi.fn(),
  };

  it("throws if script is too short", async () => {
    const shortScript = "a".repeat(100);
    await expect(extractBrief(mockProvider, shortScript)).rejects.toThrow("too short");
  });

  it("throws if script is too long", async () => {
    const longScript = "a".repeat(31000);
    await expect(extractBrief(mockProvider, longScript)).rejects.toThrow("too long");
  });

  it("returns a brief on success", async () => {
    const validScript = "a".repeat(400); // 400 chars, valid length
    
    vi.mocked(mockProvider.complete).mockResolvedValueOnce({
      success: true,
      data: {
        offer: "SaaS Product",
        audience: "Founders",
        pains: ["No time"],
        proof: ["1000 users"],
        cta: "Sign up today",
        tone: "professional",
        language: "en",
        confidence: 0.9,
      },
      usage: { inputTokens: 10, outputTokens: 10, model: "test", costCents: 0 },
    });

    const result = await extractBrief(mockProvider, validScript);
    expect(result.brief.offer).toBe("SaaS Product");
    expect(result.brief.language).toBe("en");
    expect(result.brief.confidence).toBe(0.9);
  });

  it("throws if provider fails", async () => {
    const validScript = "a".repeat(400);
    
    vi.mocked(mockProvider.complete).mockResolvedValueOnce({
      success: false,
      error: "Provider error",
    });

    await expect(extractBrief(mockProvider, validScript)).rejects.toThrow("Failed to extract brief: Provider error");
  });
});
