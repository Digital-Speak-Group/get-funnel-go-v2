import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { isAudienceAssetPath, isAudiencePath, requiresLogin } from "@/lib/auth/route-access";

const publicRateLimitCache = new Map<string, number[]>();

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Rate limiting for public audience routes
  if (isAudiencePath(pathname)) {
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    // Images get their own, larger budget so a gallery slide doesn't use up the page limit.
    const isAsset = isAudienceAssetPath(pathname);
    const bucket = `${ip}:${isAsset ? "asset" : "page"}`;
    const now = Date.now();
    const tokenCount = publicRateLimitCache.get(bucket) || [];
    const windowStart = now - 60000;
    const recentTokens = tokenCount.filter((ts: number) => ts > windowStart);
    
    const limit = isAsset ? 300 : 20;
    const reset = Math.floor((now + 60000) / 1000);
    
    if (recentTokens.length >= limit) {
      return NextResponse.json(
        { error: "Too Many Requests" }, 
        { 
          status: 429, 
          headers: { 
            "Retry-After": Math.max(1, reset - Math.floor(now / 1000)).toString(),
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": reset.toString()
          } 
        }
      );
    }
    
    recentTokens.push(now);
    publicRateLimitCache.set(bucket, recentTokens);
    
    // We want to append headers to the successful response
    response.headers.set("X-RateLimit-Limit", limit.toString());
    response.headers.set("X-RateLimit-Remaining", (limit - recentTokens.length).toString());
    response.headers.set("X-RateLimit-Reset", reset.toString());
  }

  if (!user && requiresLogin(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|jpeg|webp|ico|woff2?)$).*)",
  ],
};