"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Eye, LayoutTemplate } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SlideThumbnail } from "@/components/slides/SlideThumbnail";
import type { TemplateGalleryItem } from "@/lib/db/repositories/templates";
import { dashboardMessages } from "@/components/app/dashboard/messages";
import { TemplatePreviewDialog } from "./TemplatePreviewDialog";

const m = dashboardMessages.templates;
const ALL = "__all";

function TemplateCard({ template, onPreview }: { template: TemplateGalleryItem; onPreview: () => void }) {
  const cover = template.slides[0];
  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-colors duration-150 hover:border-border-strong">
      <div className="relative aspect-video overflow-hidden border-b border-border bg-surface-2">
        <div inert aria-hidden="true" className="size-full">
          {cover ? (
            <SlideThumbnail slide={cover} theme={template.theme} className="size-full" />
          ) : (
            <span className="flex size-full items-center justify-center">
              <LayoutTemplate className="size-8 text-faint" />
            </span>
          )}
        </div>
        {/* Overlay, not a wrapper: slides can render their own buttons/links. */}
        <button
          type="button"
          onClick={onPreview}
          aria-label={m.previewOf(template.name)}
          className="absolute inset-0 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="truncate text-h3 text-foreground">{template.name}</h2>
          <Badge variant="outline">{template.category}</Badge>
        </div>
        {template.description && (
          <p className="mt-1.5 line-clamp-2 text-small text-muted-foreground">{template.description}</p>
        )}
        <div className="mt-auto flex items-center gap-2 pt-4">
          <span className="mr-auto font-mono text-xs tabular-nums text-faint">
            {dashboardMessages.card.slides(template.slides.length)}
          </span>
          <Button variant="ghost" size="sm" onClick={onPreview}>
            <Eye />
            {m.preview}
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <Link href={`/app?template=${template.id}`}>
              {m.use}
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

export function TemplateGallery({ templates }: { templates: TemplateGalleryItem[] }) {
  const [category, setCategory] = React.useState(ALL);
  const [previewing, setPreviewing] = React.useState<TemplateGalleryItem | null>(null);

  const categories = React.useMemo(
    () => [...new Set(templates.map((t) => t.category))].sort((a, b) => a.localeCompare(b, "fr")),
    [templates]
  );
  const visible = category === ALL ? templates : templates.filter((t) => t.category === category);

  return (
    <div className="space-y-5">
      {categories.length > 1 && (
        <div
          role="group"
          aria-label={m.filterLabel}
          className="inline-flex h-9 flex-wrap items-center gap-0.5 rounded-md border border-border bg-surface p-0.5"
        >
          {[ALL, ...categories].map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={category === value}
              onClick={() => setCategory(value)}
              className={cn(
                "h-full rounded-[5px] px-3 text-sm font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                category === value
                  ? "bg-surface-3 text-foreground shadow-highlight"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {value === ALL ? m.all : value}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((template) => (
          <TemplateCard key={template.id} template={template} onPreview={() => setPreviewing(template)} />
        ))}
      </div>

      <TemplatePreviewDialog template={previewing} onOpenChange={(open) => !open && setPreviewing(null)} />
    </div>
  );
}
