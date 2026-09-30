import { describe, it, expect, vi } from "vitest";
import { POST } from "@/app/api/ai/generate/route";

vi.mock("@/lib/env", () => ({
  env: {
    GROQ_API_KEY: "test-key",
    AI_MODEL_FAST: "llama3-8b-8192",
    AI_MODEL_QUALITY: "llama3-70b-8192",
  },
}));

vi.mock("@/lib/auth/session", () => ({
  getSession: vi.fn().mockResolvedValue({
    userId: "user-1",
    activeOrgId: "org-1",
    role: "owner",
  }),
}));

vi.mock("@/lib/ai/groq", () => ({
  GroqProvider: vi.fn().mockImplementation(() => ({})),
}));

vi.mock("@/server/services/generation", () => ({
  generateDeckFromScript: vi.fn().mockImplementation(
    async (ctx, provider, script, templateConfig, themeId, options, onProgress) => {
      onProgress(JSON.stringify({ status: "EXTRACTING_BRIEF" }));
      onProgress(JSON.stringify({ status: "DONE", deckId: "deck-123" }));
      return "deck-123";
    }
  ),
}));

describe("API: /api/ai/generate", () => {
  it("streams progress events", async () => {
    const payload = {
      script: "A".repeat(300), // Min length is 300
      themeId: "00000000-0000-0000-0000-000000000000",
      templateConfig: {
        id: "vsl",
        name: "VSL",
        stages: ["Intro", "CTA"],
      },
      options: {
        slideCount: 10,
      },
    };

    const req = new Request("http://localhost:3000/api/generate", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/event-stream");

    // Check body contents
    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    
    let result = "";
    while (true) {
      const { done, value } = (await reader?.read()) || { done: true, value: undefined };
      if (done) break;
      result += decoder.decode(value);
    }

    expect(result).toContain("data: {\"status\":\"EXTRACTING_BRIEF\"}\n\n");
    expect(result).toContain("data: {\"status\":\"DONE\",\"deckId\":\"deck-123\"}\n\n");
  });

  it("returns 400 for invalid input", async () => {
    const req = new Request("http://localhost:3000/api/generate", {
      method: "POST",
      body: JSON.stringify({ script: "too short" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
