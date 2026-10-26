"use client";

import * as React from "react";
import { Check, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AUDIENCE_LINK_MESSAGES } from "./messages";

const COPIED_RESET_MS = 2000;

interface CopyAudienceLinkButtonProps {
  presentToken: string;
  className?: string;
}

/**
 * Copies the public audience URL (`/p/[token]`) for the deck. Feedback is inline
 * because the presenter route renders outside the app shell (no toaster).
 */
export function CopyAudienceLinkButton({ presentToken, className }: CopyAudienceLinkButtonProps) {
  const [state, setState] = React.useState<"idle" | "copied" | "failed">("idle");
  const resetTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

  const copy = async () => {
    const url = `${window.location.origin}/p/${encodeURIComponent(presentToken)}`;
    try {
      await navigator.clipboard.writeText(url);
      setState("copied");
    } catch {
      // Clipboard can be blocked (non-HTTPS host, permissions): open the link instead.
      window.open(url, "_blank", "noopener,noreferrer");
      setState("failed");
    }
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setState("idle"), COPIED_RESET_MS);
  };

  const label =
    state === "copied"
      ? AUDIENCE_LINK_MESSAGES.copied
      : state === "failed"
        ? AUDIENCE_LINK_MESSAGES.opened
        : AUDIENCE_LINK_MESSAGES.copy;

  return (
    <button
      type="button"
      onClick={copy}
      title={AUDIENCE_LINK_MESSAGES.hint}
      aria-label={AUDIENCE_LINK_MESSAGES.copy}
      data-testid="copy-audience-link"
      className={cn("flex items-center gap-2", className)}
    >
      {state === "copied" ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
      <span className="hidden sm:inline" aria-live="polite">
        {label}
      </span>
    </button>
  );
}
