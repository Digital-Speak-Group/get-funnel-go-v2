import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

vi.mock("@/lib/env", () => ({
  env: {
    GROQ_API_KEY: "test-key",
    AI_MODEL_FAST: "llama3-8b-8192",
    AI_MODEL_QUALITY: "llama3-70b-8192",
  },
}));

import { GroqProvider } from "@/lib/ai/groq";

// Mock the Groq SDK
vi.mock("groq-sdk", () => {
  const mockCreate = vi.fn();
  return {
    default: class MockGroq {
      chat = { completions: { create: mockCreate } };
    },
    // Export mockCreate so we can assert on it in tests
    __mockCreate: mockCreate,
  };
});

// Access the mock
const { __mockCreate } = await import("groq-sdk") as any;

describe("AIProvider (Groq Adapter)", () => {
  const provider = new GroqProvider();

  const TestSchema = z.object({
    title: z.string(),
    count: z.number(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns successfully validated data on the first try", async () => {
    __mockCreate.mockResolvedValueOnce({
      usage: { prompt_tokens: 100, completion_tokens: 50 },
      choices: [
        {
          message: {
            role: "assistant",
            tool_calls: [
              {
                id: "call_1",
                type: "function",
                function: {
                  name: "record_output",
                  arguments: JSON.stringify({ title: "Hello", count: 42 }),
                },
              },
            ],
          },
        },
      ],
    });

    const result = await provider.complete({
      tier: "fast",
      system: "Be helpful",
      input: "Say hello",
      schema: TestSchema,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ title: "Hello", count: 42 });
      expect(result.usage.inputTokens).toBe(100);
      expect(result.usage.outputTokens).toBe(50);
      // Cost cents calculation check
      expect(result.usage.costCents).toBeGreaterThanOrEqual(0);
    }
    expect(__mockCreate).toHaveBeenCalledTimes(1);
  });

  it("retries on schema failure and succeeds", async () => {
    // First attempt returns invalid data (count is a string)
    __mockCreate.mockResolvedValueOnce({
      usage: { prompt_tokens: 100, completion_tokens: 50 },
      choices: [
        {
          message: {
            role: "assistant",
            tool_calls: [
              {
                id: "call_1",
                type: "function",
                function: {
                  name: "record_output",
                  arguments: JSON.stringify({ title: "Hello", count: "forty-two" }),
                },
              },
            ],
          },
        },
      ],
    });

    // Second attempt returns valid data
    __mockCreate.mockResolvedValueOnce({
      usage: { prompt_tokens: 200, completion_tokens: 50 },
      choices: [
        {
          message: {
            role: "assistant",
            tool_calls: [
              {
                id: "call_2",
                type: "function",
                function: {
                  name: "record_output",
                  arguments: JSON.stringify({ title: "Hello", count: 42 }),
                },
              },
            ],
          },
        },
      ],
    });

    const result = await provider.complete({
      tier: "fast",
      system: "Be helpful",
      input: "Say hello",
      schema: TestSchema,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ title: "Hello", count: 42 });
      // Usages should accumulate
      expect(result.usage.inputTokens).toBe(300);
      expect(result.usage.outputTokens).toBe(100);
    }
    expect(__mockCreate).toHaveBeenCalledTimes(2);
  });

  it("fails if schema validation fails twice", async () => {
    __mockCreate.mockResolvedValue({
      usage: { prompt_tokens: 100, completion_tokens: 50 },
      choices: [
        {
          message: {
            role: "assistant",
            tool_calls: [
              {
                id: "call_1",
                type: "function",
                function: {
                  name: "record_output",
                  arguments: JSON.stringify({ title: "Hello" }), // Missing count
                },
              },
            ],
          },
        },
      ],
    });

    const result = await provider.complete({
      tier: "fast",
      system: "Be helpful",
      input: "Say hello",
      schema: TestSchema,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("failed schema validation twice");
      expect(result.usage?.inputTokens).toBe(200);
    }
    expect(__mockCreate).toHaveBeenCalledTimes(2);
  });
});
