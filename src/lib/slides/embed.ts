/**
 * Sites a slide may embed in an iframe (spec decision 11): funnel tools and the agency's own
 * page domains. A host matches a listed domain or any of its subdomains. Checked in the slide
 * schema (so every server write and AI output is validated) and again before rendering.
 */
export const EMBED_ALLOWED_DOMAINS = [
  "funnelytics.io",
  "clickfunnels.com",
  "myclickfunnels.com",
  "systeme.io",
  "getfunnels.agency",
  "go-scale.systems",
  "video-ads-agency.com",
] as const;

const sameSite = (a: string, b: string) => a === b || a.endsWith(`.${b}`) || b.endsWith(`.${a}`);

/** The app's own host: never embeddable (see EMBED_SANDBOX). */
function appHost(): string | null {
  try {
    return new URL(process.env.NEXT_PUBLIC_APP_URL ?? "").hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function isAllowedEmbedUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" || url.username || url.password) return false;
  const host = url.hostname.toLowerCase();
  const own = appHost();
  if (own && sameSite(host, own)) return false;
  return EMBED_ALLOWED_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

/**
 * Sandbox for embedded pages (decided 2026-10-09). The funnel pages need scripts and their own
 * cookies/storage, so they get `allow-scripts` + `allow-same-origin`: without the latter they
 * render blank. That pair only lets a frame escape its sandbox when it shares the parent's
 * origin, and an embed never can: the allow-list holds third-party domains only, and
 * `isAllowedEmbedUrl` refuses the app's own host and its parent/sub-domains. Each page keeps
 * its own origin (no access to our cookies, storage or DOM); top navigation stays blocked.
 */
export const EMBED_SANDBOX =
  "allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox";
