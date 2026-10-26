import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AIProvider } from "@/lib/ai/provider";

// Net credit movement for the org: reserves add, refunds subtract.
let balance = 0;

vi.mock("@/server/services/credits", () => ({
  reserveCredits: vi.fn(async (_ctx: unknown, amount: number) => {
    balance += amount;
    return true;
  }),
  refundCredits: vi.fn(async (_ctx: unknown, amount: number) => {
    balance -= amount;
  }),
}));

vi.mock("@/lib/db/repositories/usage", () => ({
  logGeneration: vi.fn().mockResolvedValue({}),
  incrementDecksCreated: vi.fn().mockResolvedValue({}),
}));

const transaction = vi.fn();
vi.mock("@/lib/db/client", () => ({ db: { transaction: (cb: unknown) => transaction(cb) } }));

const usage = (costCents: number) => ({ inputTokens: 1, outputTokens: 1, model: "test", costCents });
const slideCost = { value: 0 };

vi.mock("@/server/ai/stages/extractBrief", () => ({
  extractBrief: vi.fn(async () => ({
    brief: { offer: "o", audience: "a", pains: [], proof: [], cta: "c", tone: "professional", language: "fr", confidence: 1 },
    usage: usage(0),
  })),
}));
vi.mock("@/server/ai/stages/planDeck", () => ({
  planDeck: vi.fn(async () => ({ plan: [{ type: "cover", headline: "h", purpose: "p" }], usage: usage(0) })),
}));
vi.mock("@/server/ai/stages/generateSlides", () => ({
  generateSlides: vi.fn(async () => ({ slides: [], usage: usage(slideCost.value), failures: 0 })),
}));

const { generateDeckFromScript } = await import("@/server/services/generation");

const ctx = { orgId: "org", userId: "user" };
const template = { id: "60000000-0000-4000-8000-000000000002", name: "VSL", stages: ["Intro"] };
const run = () =>
  generateDeckFromScript(ctx, {} as AIProvider, "script", template, "theme", { slideCount: 5 });

describe("Service: generation credits", () => {
  beforeEach(() => {
    balance = 0;
    slideCost.value = 0;
    transaction.mockReset();
  });

  it("charges 20 credits on success", async () => {
    slideCost.value = 2;
    transaction.mockResolvedValue(undefined);

    await run();

    expect(balance).toBe(20);
  });

  it("charges higher cost if actual cost exceeds 20 credits", async () => {
    slideCost.value = 25;
    transaction.mockResolvedValue(undefined);

    await run();

    expect(balance).toBe(25);
  });

  it("nets to zero when saving fails", async () => {
    transaction.mockRejectedValue(new Error("insert failed"));

    await expect(run()).rejects.toThrow("insert failed");

    expect(balance).toBe(0);
  });
});

