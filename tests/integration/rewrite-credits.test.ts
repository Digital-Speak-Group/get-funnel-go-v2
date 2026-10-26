import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AIProvider, CompletionArgs } from "@/lib/ai/provider";

// Net credit movement for the org: reserves add, refunds subtract.
let balance = 0;
let allow = true;

vi.mock("@/server/services/credits", () => ({
  reserveCredits: vi.fn(async (_ctx: unknown, amount: number) => {
    if (!allow) return false;
    balance += amount;
    return true;
  }),
  refundCredits: vi.fn(async (_ctx: unknown, amount: number) => {
    balance -= amount;
  }),
}));
vi.mock("@/lib/db/repositories/usage", () => ({ logGeneration: vi.fn().mockResolvedValue({}) }));

const { rewriteText, REWRITE_COST_CENTS } = await import("@/server/services/rewrite");

const ctx = { orgId: "org", userId: "user" };
const input = { deck: { id: "d", title: "Deck", language: "fr" }, text: "Notre offre est vraiment très très bien.", action: "shorter" as const, maxLength: 120 };

function provider(result: "ok" | "fail", costCents = 0): AIProvider & { last?: CompletionArgs<unknown> } {
  const p: AIProvider & { last?: CompletionArgs<unknown> } = {
    async complete<T>(args: CompletionArgs<T>) {
      p.last = args as CompletionArgs<unknown>;
      const usage = { inputTokens: 10, outputTokens: 5, model: "test", costCents };
      if (result === "fail") return { success: false as const, error: "boom", usage };
      return { success: true as const, data: args.schema.parse({ text: "  Notre offre est excellente.  " }), usage };
    },
  };
  return p;
}

describe("Service: rewrite (Task 79)", () => {
  beforeEach(() => {
    balance = 0;
    allow = true;
  });

  it("returns the rewritten text and charges its real cost", async () => {
    const p = provider("ok", 3);
    await expect(rewriteText(ctx, input, p)).resolves.toEqual({ ok: true, text: "Notre offre est excellente." });
    expect(balance).toBe(3);
    expect(p.last?.input).toContain("<TEXT>Notre offre est vraiment très très bien.</TEXT>");
    expect(p.last?.input).toContain("MAXIMUM LENGTH: 120");
  });

  it("refunds the reservation down to a cheaper real cost", async () => {
    await rewriteText(ctx, input, provider("ok", 0));
    expect(balance).toBe(0);
  });

  it("refunds everything when the AI fails", async () => {
    await expect(rewriteText(ctx, input, provider("fail", 2))).resolves.toEqual({ ok: false, error: "FAILED" });
    expect(balance).toBe(0);
  });

  it("refuses without credits, before calling the AI", async () => {
    allow = false;
    const p = provider("ok");
    await expect(rewriteText(ctx, input, p)).resolves.toEqual({ ok: false, error: "NO_CREDITS" });
    expect(p.last).toBeUndefined();
    expect(REWRITE_COST_CENTS).toBeGreaterThan(0);
  });

  it("asks for the text's own length limit", async () => {
    const p = provider("ok");
    await rewriteText(ctx, { ...input, maxLength: 10 }, p);
    expect(p.last!.schema.safeParse({ text: "x".repeat(11) }).success).toBe(false);
  });
});
