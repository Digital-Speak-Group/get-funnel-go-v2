import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";

const originalEnv = process.env;

describe("env validation", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("throws on missing required server env", async () => {
    delete process.env.DATABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.AUTH_SECRET;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.AI_MODEL_FAST;
    delete process.env.AI_MODEL_QUALITY;
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.RESEND_API_KEY;

    await expect(import("@/lib/env")).rejects.toThrow("Invalid environment variables");
  });

  it("throws on missing required client env", async () => {
    process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/getfunnels";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test";
    process.env.AUTH_SECRET = "a".repeat(32);
    process.env.ANTHROPIC_API_KEY = "test";
    process.env.AI_MODEL_FAST = "claude-3-5-haiku-20241022";
    process.env.AI_MODEL_QUALITY = "claude-3-5-sonnet-20241022";
    process.env.STRIPE_SECRET_KEY = "test";
    process.env.STRIPE_WEBHOOK_SECRET = "test";
    process.env.RESEND_API_KEY = "test";

    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    delete process.env.NEXT_PUBLIC_APP_URL;

    await expect(import("@/lib/env")).rejects.toThrow("Invalid environment variables");
  });

  it("accepts valid env", async () => {
    process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/getfunnels";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test";
    process.env.AUTH_SECRET = "a".repeat(32);
    process.env.ANTHROPIC_API_KEY = "test";
    process.env.AI_MODEL_FAST = "claude-3-5-haiku-20241022";
    process.env.AI_MODEL_QUALITY = "claude-3-5-sonnet-20241022";
    process.env.STRIPE_SECRET_KEY = "test";
    process.env.STRIPE_WEBHOOK_SECRET = "test";
    process.env.RESEND_API_KEY = "test";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test";
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_test";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";

    const { env } = await import("@/lib/env");
    expect(env.DATABASE_URL).toBeDefined();
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined();
  });
});