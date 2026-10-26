/**
 * Icon names a slide may reference (Bullet.icon). Curated rather than all of lucide so the
 * slide bundle stays small and the AI and the future icon picker share one vocabulary.
 * Names are lucide's kebab-case ids; rendering lives in src/components/slides/icons.tsx.
 */
export const SLIDE_ICON_NAMES = [
  // Growth & results
  "trending-up", "trending-down", "bar-chart", "bar-chart-2", "chart", "line-chart", "pie-chart",
  "activity", "gauge", "target", "award", "trophy", "crown", "star", "rocket", "zap", "flag",
  // Money & commerce
  "dollar-sign", "wallet", "coins", "banknote", "credit-card", "shopping-cart", "percent", "gift",
  // Funnel & marketing
  "filter", "funnel", "magnet", "megaphone", "mouse-pointer-click", "route", "workflow", "repeat",
  "layers", "layout", "presentation", "video", "play", "eye", "search",
  // People & communication
  "users", "handshake", "message-circle", "mail", "phone", "smartphone", "send", "bell", "headphones",
  // Time & planning
  "clock", "timer", "hourglass", "calendar", "calendar-check", "calendar-x", "clipboard",
  // Trust & quality
  "shield", "shield-check", "lock", "check", "circle-check", "thumbs-up", "heart",
  // Ideas & tech
  "lightbulb", "sparkles", "brain", "bot", "cpu", "database", "settings", "puzzle", "globe",
  "map-pin", "briefcase", "infinity",
] as const;

export type SlideIconName = (typeof SLIDE_ICON_NAMES)[number];

const ICON_NAME_SET: ReadonlySet<string> = new Set(SLIDE_ICON_NAMES);

export function isSlideIconName(value: string): value is SlideIconName {
  return ICON_NAME_SET.has(value);
}
