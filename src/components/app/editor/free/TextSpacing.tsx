"use client";

import * as React from "react";
import { ALargeSmall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { TEXT_STYLE_SPECS, type FreeText } from "@/lib/slides/free";
import { FREE_MESSAGES } from "../messages";
import { inputClass } from "../fields/field-ui";

const m = FREE_MESSAGES.spacing;
const keepFocus = (event: Event) => event.preventDefault();

export type SpacingPatch = Partial<Pick<FreeText, "size" | "lineHeight" | "letterSpacing">>;

/** Font size, line height and letter spacing of the selected text (Task 76). */
export function TextSpacing({
  text,
  onChange,
}: {
  text: FreeText;
  /** Patch for the selected texts, with the undo group of the control being used. */
  onChange: (patch: SpacingPatch, group: string) => void;
}) {
  const spec = TEXT_STYLE_SPECS[text.style];
  const size = text.size ?? spec.size;
  const lineHeight = text.lineHeight ?? spec.lineHeight;
  const letterSpacing = text.letterSpacing ?? 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" size="sm" variant="ghost" aria-label={`${m.button} : ${size} px`} title={m.button} data-testid="free-spacing">
          <ALargeSmall aria-hidden="true" />
          <span className="font-mono text-xs tabular-nums">{size}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 space-y-4 p-3" onCloseAutoFocus={keepFocus}>
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="free-text-size" className="text-small font-medium text-foreground">
            {m.size}
          </label>
          <input
            id="free-text-size"
            type="number"
            min={10}
            max={200}
            value={size}
            data-testid="free-text-size"
            className={`${inputClass(false)} h-8 w-20 py-1`}
            onChange={(e) => {
              const value = Math.round(Number(e.target.value));
              if (value >= 10 && value <= 200) onChange({ size: value }, "size");
            }}
          />
        </div>
        <Row label={m.lineHeight} value={lineHeight.toFixed(2)}>
          <Slider
            min={80}
            max={300}
            step={5}
            value={[Math.round(lineHeight * 100)]}
            thumbLabel={m.lineHeight}
            onValueChange={([v]) => onChange({ lineHeight: v / 100 }, "lineHeight")}
          />
        </Row>
        <Row label={m.letterSpacing} value={`${letterSpacing.toFixed(2)} em`}>
          <Slider
            min={-10}
            max={50}
            step={1}
            value={[Math.round(letterSpacing * 100)]}
            thumbLabel={m.letterSpacing}
            onValueChange={([v]) => onChange({ letterSpacing: v === 0 ? undefined : v / 100 }, "letterSpacing")}
          />
        </Row>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="w-full"
          onClick={() => onChange({ size: undefined, lineHeight: undefined, letterSpacing: undefined }, "spacing-reset")}
        >
          {m.reset}
        </Button>
      </PopoverContent>
    </Popover>
  );
}

function Row({ label, value, children }: { label: string; value: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-small">
        <span className="font-medium text-foreground">{label}</span>
        <span className="font-mono tabular-nums text-muted-foreground">{value}</span>
      </div>
      {children}
    </div>
  );
}
