"use client";

import * as React from "react";
import { Download, FileText, Loader2, Presentation } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EXPORT_MESSAGES } from "./messages";

type ExportFormat = "pdf" | "pptx";

interface ExportMenuProps {
  deckId: string;
  deckTitle: string;
}

/**
 * Downloads the deck as PDF or PowerPoint. Fetched rather than a plain `<a download>` so a
 * server error shows a message instead of a broken "export.json" download, and so the
 * user sees progress while Chrome renders every slide (several seconds).
 */
export function ExportMenu({ deckId, deckTitle }: ExportMenuProps) {
  const [busy, setBusy] = React.useState<ExportFormat | null>(null);

  const exportAs = async (format: ExportFormat) => {
    if (busy) return;
    setBusy(format);
    try {
      const res = await fetch(`/api/decks/${deckId}/export?format=${format}`);
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
      link.download = `${deckTitle || "deck"}.${format}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(EXPORT_MESSAGES.failed);
    } finally {
      setBusy(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={busy !== null}
          aria-busy={busy !== null}
          data-testid="export-menu"
        >
          {busy ? <Loader2 className="animate-spin" /> : <Download />}
          <span className="hidden sm:inline">{busy ? EXPORT_MESSAGES.busy : EXPORT_MESSAGES.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => void exportAs("pdf")} data-testid="export-pdf">
          <FileText />
          {EXPORT_MESSAGES.pdf}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void exportAs("pptx")} data-testid="export-pptx">
          <Presentation />
          {EXPORT_MESSAGES.pptx}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
