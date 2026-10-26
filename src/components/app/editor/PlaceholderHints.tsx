import * as React from "react";
import { PLACEHOLDER_MESSAGES as m } from "./messages";

/** Compact marker for the slide list. */
export function PlaceholderBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span
      data-testid="slide-placeholder-badge"
      aria-label={m.badgeLabel(count)}
      title={m.badgeLabel(count)}
      className="ml-1.5 inline-flex items-center rounded-full border border-warning/40 bg-warning/10 px-1.5 text-xs font-medium text-warning"
    >
      {m.badge}
    </span>
  );
}

/** Lists the placeholders still present on the active slide. */
export function PlaceholderNotice({ placeholders }: { placeholders: string[] }) {
  if (placeholders.length === 0) return null;
  return (
    <div
      role="note"
      data-testid="slide-placeholder-notice"
      className="space-y-1.5 rounded-lg border border-warning/40 bg-warning/10 p-3 text-small text-foreground"
    >
      <p>{m.notice}</p>
      <ul className="flex flex-wrap gap-1.5">
        {placeholders.map((p) => (
          <li key={p} className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs text-warning">
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}
