"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { SlideThumbnail } from "@/components/slides/SlideThumbnail";
import type { TemplateGalleryItem } from "@/lib/db/repositories/templates";
import { dashboardMessages } from "@/components/app/dashboard/messages";

const m = dashboardMessages.templates;

interface TemplatePreviewDialogProps {
  template: TemplateGalleryItem | null;
  onOpenChange: (open: boolean) => void;
}

export function TemplatePreviewDialog({ template, onOpenChange }: TemplatePreviewDialogProps) {
  const [index, setIndex] = React.useState(0);
  const stripRef = React.useRef<HTMLDivElement>(null);
  const slides = template?.slides ?? [];
  const current = slides[index];

  React.useEffect(() => setIndex(0), [template?.id]);

  // Keep the active thumbnail centered in the strip. Not scrollIntoView: that also scrolls the dialog.
  React.useEffect(() => {
    const strip = stripRef.current;
    const active = strip?.querySelector<HTMLElement>(`[data-index="${index}"]`);
    if (!strip || !active) return;
    strip.scrollTo({ left: active.offsetLeft - (strip.clientWidth - active.clientWidth) / 2, behavior: "smooth" });
  }, [index]);

  const step = (delta: number) =>
    setIndex((i) => Math.min(Math.max(i + delta, 0), Math.max(slides.length - 1, 0)));

  return (
    <Dialog open={template !== null} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-5xl gap-0 p-0"
        // Focus the dialog, not the first thumbnail: arrows drive selection, Tab reaches the controls.
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          (e.currentTarget as HTMLElement | null)?.focus();
        }}
        onKeyDown={(e) => {
          if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
          // The browser's default arrow scroll on the strip would cancel our smooth scroll.
          e.preventDefault();
          step(e.key === "ArrowRight" ? 1 : -1);
        }}
      >
        {template && (
          <>
            <div className="flex flex-col gap-1 border-b border-border p-5 pr-12">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-h2">{template.name}</DialogTitle>
                <Badge variant="outline">{template.category}</Badge>
              </div>
              <DialogDescription>{template.description}</DialogDescription>
            </div>

            <div className="space-y-4 bg-background/40 p-5">
              {/* Height-capped so header, strip, and footer always fit on screen. */}
              <div className="relative mx-auto w-full max-w-[calc(52dvh*16/9)] overflow-hidden rounded-lg border border-border">
                {current ? (
                  <div inert aria-label={m.slideOf(index + 1, slides.length)} role="img">
                    <SlideThumbnail slide={current} theme={template.theme} className="aspect-video w-full" />
                  </div>
                ) : (
                  <div className="aspect-video w-full bg-surface-2" />
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon-sm" onClick={() => step(-1)} disabled={index === 0} aria-label="Slide précédent">
                  <ChevronLeft />
                </Button>
                <div
                  ref={stripRef}
                  className="relative flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1"
                  role="listbox"
                  aria-label={m.previewOf(template.name)}
                >
                  {slides.map((slide, i) => (
                    // Slides can render their own buttons/links, so the hit target is an overlay, not a wrapper.
                    <div
                      key={slide.id}
                      data-index={i}
                      className={cn(
                        "relative w-28 shrink-0 overflow-hidden rounded-md border transition-[border-color,opacity] focus-within:ring-2 focus-within:ring-ring",
                        i === index ? "border-ring" : "border-border opacity-60 hover:opacity-100"
                      )}
                    >
                      <div inert aria-hidden="true">
                        <SlideThumbnail slide={slide} theme={template.theme} className="aspect-video w-full" />
                      </div>
                      <button
                        type="button"
                        role="option"
                        aria-selected={i === index}
                        aria-label={m.slideOf(i + 1, slides.length)}
                        onClick={() => setIndex(i)}
                        className="absolute inset-0 outline-none"
                      />
                    </div>
                  ))}
                </div>
                <Button variant="ghost" size="icon-sm" onClick={() => step(1)} disabled={index >= slides.length - 1} aria-label="Slide suivant">
                  <ChevronRight />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3">
              <span className="font-mono text-small tabular-nums text-faint">
                {slides.length > 0 ? `${index + 1} / ${slides.length}` : ""}
              </span>
              <Button asChild>
                <Link href={`/app?template=${template.id}`}>
                  {m.use}
                  <ArrowRight />
                </Link>
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
