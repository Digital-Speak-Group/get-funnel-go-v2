"use client";

import * as React from "react";
import { Box, Square, SquareDashed } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { STROKE_DASHES, type FreeElement, type FreeShape } from "@/lib/slides/free";
import type { ThemeTokens } from "@/lib/slides/theme";
import { cn } from "@/lib/utils";
import { FREE_MESSAGES as m } from "../messages";
import { ColorPicker } from "./StyleControls";

const keepFocus = (event: Event) => event.preventDefault();

type BorderPatch = Partial<Pick<FreeShape, "stroke" | "strokeWidth" | "dash" | "radius">>;

/**
 * Border of the selected shapes (Task 77): on/off, theme colour, width, dash; corner rounding
 * for rectangles. `group` merges a slider drag into one undo step.
 */
export function BorderControl({
  shape,
  theme,
  onChange,
}: {
  shape: FreeShape;
  theme: ThemeTokens;
  onChange: (patch: BorderPatch, group?: string) => void;
}) {
  const on = !!shape.stroke;
  const width = shape.strokeWidth ?? 4;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" size="icon-sm" variant="ghost" data-testid="free-border" aria-label={m.border.button} title={m.border.button}>
          {on ? <Square aria-hidden="true" /> : <SquareDashed aria-hidden="true" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 space-y-3 p-3" onCloseAutoFocus={keepFocus}>
        <label className="flex items-center justify-between gap-2 text-small font-medium text-foreground">
          {m.border.button}
          <Switch
            checked={on}
            data-testid="free-border-toggle"
            onCheckedChange={(checked) => onChange(checked ? { stroke: "primary" } : { stroke: undefined, strokeWidth: undefined, dash: undefined })}
          />
        </label>
        {on && (
          <>
            <ColorPicker label={m.border.color} value={shape.stroke!} theme={theme} onChange={(stroke) => onChange({ stroke })} />
            <div className="space-y-1.5">
              <div className="flex justify-between text-small">
                <span className="text-foreground">{m.border.width}</span>
                <span className="font-mono tabular-nums text-muted-foreground">{width} px</span>
              </div>
              <Slider min={1} max={40} step={1} value={[width]} thumbLabel={m.border.width} onValueChange={([v]) => onChange({ strokeWidth: v }, "strokeWidth")} />
            </div>
            <div className="grid grid-cols-3 gap-1 rounded-md bg-surface-2 p-1" role="group" aria-label={m.border.dash}>
              {STROKE_DASHES.map((dash) => {
                const active = (shape.dash ?? "solid") === dash;
                return (
                  <button
                    key={dash}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onChange({ dash: dash === "solid" ? undefined : dash })}
                    className={cn(
                      "rounded px-1 py-1 text-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                      active ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {m.border.dashes[dash]}
                  </button>
                );
              })}
            </div>
          </>
        )}
        {shape.shape === "rect" && (
          <div className="space-y-1.5 border-t border-border pt-3">
            <div className="flex justify-between text-small">
              <span className="text-foreground">{m.border.radius}</span>
              <span className="font-mono tabular-nums text-muted-foreground">{shape.radius ?? 0} px</span>
            </div>
            <Slider min={0} max={200} step={2} value={[shape.radius ?? 0]} thumbLabel={m.border.radius} onValueChange={([v]) => onChange({ radius: v }, "radius")} />
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** Drop shadow of the selection, any element kind (Task 77). */
export function ShadowControl({ value, onChange }: { value: FreeElement["shadow"]; onChange: (shadow: FreeElement["shadow"]) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          data-testid="free-shadow"
          aria-label={`${m.shadow.button} : ${m.shadow[value ?? "none"]}`}
          title={m.shadow.button}
          className={cn(value && "bg-surface-3 text-foreground")}
        >
          <Box aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" onCloseAutoFocus={keepFocus}>
        <DropdownMenuRadioGroup value={value ?? "none"} onValueChange={(v) => onChange(v === "none" ? undefined : (v as FreeElement["shadow"]))}>
          {(["none", "soft", "strong"] as const).map((v) => (
            <DropdownMenuRadioItem key={v} value={v} data-testid={`free-shadow-${v}`}>
              {m.shadow[v]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
