"use client";

import * as React from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EXPORT_MESSAGES } from "./messages";

interface ExportPdfButtonProps {
  deckId: string;
  deckTitle: string;
}

/**
 * Downloads the deck PDF. Fetched rather than a plain `<a download>` so a server
 * error shows a message instead of a broken "export.json" download, and so the
 * user sees progress while Chrome renders every slide (several seconds).
 */
export function ExportPdfButton({ deckId, deckTitle }: ExportPdfButtonProps) {
  const [busy, setBusy] = React.useState(false);

  const exportPdf = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/decks/${deckId}/export`);
      if (!res.ok) {
        const body: unknown = await res.json().catch(() => null);
        const message =
          body && typeof body === "object" && "error" in body && typeof body.error === "string"
            ? body.error
            : EXPORT_MESSAGES.failed;
        toast.error(message);
        return;
      }
      const url = URL.createObjectURL(await res.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `${deckTitle || "deck"}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(EXPORT_MESSAGES.failed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={exportPdf}
      disabled={busy}
      aria-busy={busy}
      data-testid="export-pdf"
    >
      {busy ? <Loader2 className="animate-spin" /> : <Download />}
      <span className="hidden sm:inline">{busy ? EXPORT_MESSAGES.busy : EXPORT_MESSAGES.label}</span>
    </Button>
  );
}
