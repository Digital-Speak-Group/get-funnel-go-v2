import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { rateLimit, getRateLimitHeaders } from "../../src/lib/rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests under the limit", async () => {
    const limiter = rateLimit({ interval: 60000, limit: 3 });
    const ip = "127.0.0.1";

    expect((await limiter.check(ip)).success).toBe(true);
    expect((await limiter.check(ip)).success).toBe(true);
    expect((await limiter.check(ip)).success).toBe(true);
  });

  it("blocks requests over the limit", async () => {
    const limiter = rateLimit({ interval: 60000, limit: 2 });
    const ip = "127.0.0.2";

    expect((await limiter.check(ip)).success).toBe(true);
    expect((await limiter.check(ip)).success).toBe(true);
    
    // 3rd request should fail
    expect((await limiter.check(ip)).success).toBe(false);
  });

  it("resets after the interval", async () => {
    const limiter = rateLimit({ interval: 1000, limit: 1 });
    const ip = "127.0.0.3";

    expect((await limiter.check(ip)).success).toBe(true);
    expect((await limiter.check(ip)).success).toBe(false);

    vi.advanceTimersByTime(1001);

    expect((await limiter.check(ip)).success).toBe(true);
  });

  it("generates correct HTTP headers", async () => {
    const limiter = rateLimit({ interval: 60000, limit: 5 });
    const ip = "127.0.0.4";
    
    // First request
    const res1 = await limiter.check(ip);
    const headers1 = getRateLimitHeaders(res1) as Record<string, string>;
    
    expect(headers1["X-RateLimit-Limit"]).toBe("5");
    expect(headers1["X-RateLimit-Remaining"]).toBe("4");
    expect(headers1["X-RateLimit-Reset"]).toBeDefined();
    expect(headers1["Retry-After"]).toBeUndefined();
    
    // Exhaust limits
    await limiter.check(ip);
    await limiter.check(ip);
    await limiter.check(ip);
    await limiter.check(ip);
    
    // Blocked request
    const resBlocked = await limiter.check(ip);
    const headersBlocked = getRateLimitHeaders(resBlocked) as Record<string, string>;
    
    expect(headersBlocked["X-RateLimit-Limit"]).toBe("5");
    expect(headersBlocked["X-RateLimit-Remaining"]).toBe("0");
    expect(headersBlocked["X-RateLimit-Reset"]).toBeDefined();
    expect(headersBlocked["Retry-After"]).toBeDefined();
  });
});
