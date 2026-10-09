/** Which paths the middleware lets through without a session. Pure, so it is unit-tested. */

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/callback", // email confirmation landing — the user has no session yet
  "/auth/forgot-password",
  "/auth/reset-password",
  "/pricing",
  "/legal/terms",
  "/legal/privacy",
  "/opengraph-image", // fetched by link-preview crawlers
  "/dev", // design review routes; they 404 in production
];

function matches(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(prefix + "/");
}

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => matches(pathname, p));
}

/** Route handlers authenticate themselves (401 JSON, Stripe signatures); never redirect them to /login. */
export function isApiPath(pathname: string): boolean {
  return matches(pathname, "/api");
}

/** Public audience view — token-gated, rate-limited, never redirected. */
export function isAudiencePath(pathname: string): boolean {
  return pathname.startsWith("/p/");
}

/** Images of an audience deck (`/p/<token>/assets/<id>`): a gallery loads several per slide. */
export function isAudienceAssetPath(pathname: string): boolean {
  return /^\/p\/[^/]+\/assets\/[^/]+$/.test(pathname);
}

export function requiresLogin(pathname: string): boolean {
  return !isPublicPath(pathname) && !isApiPath(pathname) && !isAudiencePath(pathname);
}
