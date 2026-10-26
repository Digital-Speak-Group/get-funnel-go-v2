"use client";

import * as React from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { TOPBAR_MESSAGES as m } from "./messages";
import { useIsLarge } from "./useIsLarge";

/**
 * The slide's properties: a side panel from `lg` up, a bottom sheet below. Only one copy is
 * ever rendered, so form fields (and their test ids) exist once.
 */
export function EditorInspector({ hidden, children }: { hidden?: boolean; children: React.ReactNode }) {
  const isLarge = useIsLarge();

  if (isLarge) {
    return (
      <aside
        aria-label={m.inspector}
        className={cn("space-y-6 rounded-lg border border-border bg-surface p-4", hidden && "hidden")}
        data-testid="editor-inspector"
      >
        {children}
      </aside>
    );
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" variant="secondary" className="w-full" data-testid="editor-inspector-open">
          <SlidersHorizontal aria-hidden="true" />
          {m.inspector}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="overflow-y-auto p-4">
        <SheetTitle className="mb-4 text-h3">{m.inspector}</SheetTitle>
        <div className="space-y-6">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
