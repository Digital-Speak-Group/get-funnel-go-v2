import { shellMessages as m } from "./messages";

export interface Crumb {
  href: string;
  label: string;
}

/** Breadcrumb trail for an /app pathname. Unknown segments (ids) are skipped. */
export function breadcrumbsFor(pathname: string): Crumb[] {
  const parts = pathname.split("/").filter(Boolean);
  const crumbs: Crumb[] = [];
  for (let i = 1; i <= parts.length; i++) {
    const href = "/" + parts.slice(0, i).join("/");
    const label = m.breadcrumbs[href];
    if (!label) continue;
    // "/app" is the Decks list: only an ancestor of deck pages.
    if (href === "/app" && pathname !== "/app" && !pathname.startsWith("/app/decks/")) continue;
    crumbs.push({ href: href === "/app/decks" ? "/app" : href, label });
  }
  return crumbs;
}
