import { LRUCache } from "lru-cache";

interface RateLimitOptions {
  interval: number; // in ms
  limit: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export function rateLimit(options: RateLimitOptions) {
  const tokenCache = new LRUCache<string, number[]>({
    max: 500,
    ttl: options.interval,
  });

  return {
    check: async (identifier: string): Promise<RateLimitResult> => {
      const now = Date.now();
      const tokenCount = tokenCache.get(identifier) || [];
      
      const windowStart = now - options.interval;
      const recentTokens = tokenCount.filter((ts) => ts > windowStart);
      
      const reset = Math.floor((now + options.interval) / 1000);
      
      if (recentTokens.length >= options.limit) {
        tokenCache.set(identifier, recentTokens);
        return {
          success: false,
          limit: options.limit,
          remaining: 0,
          reset,
        };
      }
      
      recentTokens.push(now);
      tokenCache.set(identifier, recentTokens);
      
      return {
        success: true,
        limit: options.limit,
        remaining: options.limit - recentTokens.length,
        reset,
      };
    },
  };
}

export function getRateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.reset.toString(),
    ...(result.success ? {} : { "Retry-After": Math.max(1, result.reset - Math.floor(Date.now() / 1000)).toString() }),
  };
}
