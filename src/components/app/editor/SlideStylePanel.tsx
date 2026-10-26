"use client";

import * as React from "react";
import { ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useAssetUrl } from "@/components/slides/asset-url";
import { parseSlideBackground } from "@/components/slides/SlideStyleBackground";
import {
  GRADIENT_ANGLES,
  SLIDE_TRANSITIONS,
  SlideTransitionSchema,
  defaultBackground,
  type SlideBackground,
  type SlideBackgroundKind,
  type SlideTransition,
} from "@/lib/slides/slide-style";
import type { ThemeTokens } from "@/lib/slides/theme";
import { cn } from "@/lib/utils";
import { useAssetUpload } from "./asset-upload";
import { ColorPicker } from "./free/StyleControls";
import { SLIDE_STYLE_MESSAGES as m } from "./messages";

interface SlideStylePanelProps {
  content: Record<string, unknown>;
  theme: ThemeTokens;
  /** New content with the background/transition set (undefined removes the key). */
  onChange: (content: Record<string, unknown>) => void;
}

const KINDS = ["theme", "color", "gradient", "image"] as const;

function withKey(content: Record<string, unknown>, key: string, value: unknown) {
  const next = { ...content };
  if (value === undefined) delete next[key];
  else next[key] = value;
  return next;
}

/** Inspector section for the slide's own background and its entrance transition (Tasks 73–74). */
export function SlideStylePanel({ content, theme, onChange }: SlideStylePanelProps) {
  const background = parseSlideBackground(content.background);
  const parsedTransition = SlideTransitionSchema.safeParse(content.transition);
  const transition: SlideTransition = parsedTransition.success ? parsedTransition.data : "fade";
  const setBackground = (next: SlideBackground | undefined) => onChange(withKey(content, "background", next));
  const kind = background?.kind ?? "theme";

  return (
    <details className="mb-4 rounded-lg border border-border px-3 py-2" open={!!background || parsedTransition.success} data-testid="slide-style-panel">
      <summary className="cursor-pointer text-sm font-medium text-foreground">
        {m.section}
        {background && <span className="font-normal text-muted-foreground"> · {m.kinds[background.kind]}</span>}
      </summary>

      <div className="mt-3 space-y-3">
        <div className="space-y-1.5">
          <span className="text-small font-medium text-foreground" id="slide-bg-label">
            {m.background}
          </span>
          <div className="grid grid-cols-4 gap-1 rounded-md bg-surface-2 p-1" role="group" aria-labelledby="slide-bg-label">
            {KINDS.map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={kind === k}
                data-testid={`slide-bg-${k}`}
                onClick={() => setBackground(k === "theme" ? undefined : kind === k ? background! : defaultBackground(k as SlideBackgroundKind))}
                className={cn(
                  "rounded px-1 py-1 text-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                  kind === k ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {m.kinds[k]}
              </button>
            ))}
          </div>
        </div>

        {background?.kind === "color" && (
          <ColorPicker label={m.color} value={background.color} theme={theme} onChange={(color) => setBackground({ ...background, color })} />
        )}
        {background?.kind === "gradient" && (
          <div className="flex flex-wrap items-center gap-1">
            <ColorPicker label={m.from} value={background.from} theme={theme} onChange={(from) => setBackground({ ...background, from })} />
            <ColorPicker label={m.to} value={background.to} theme={theme} onChange={(to) => setBackground({ ...background, to })} />
            <Select value={String(background.angle)} onValueChange={(v) => setBackground({ ...background, angle: Number(v) })}>
              <SelectTrigger className="h-8 w-20" aria-label={m.angle}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GRADIENT_ANGLES.map((deg) => (
                  <SelectItem key={deg} value={String(deg)}>
                    {m.angleValue(deg)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {background?.kind === "image" && <ImageBackground background={background} onChange={setBackground} />}

        <div className="space-y-1">
          <label htmlFor="slide-transition" className="text-small font-medium text-foreground">
            {m.transition}
          </label>
          <Select
            value={transition}
            onValueChange={(v) => onChange(withKey(content, "transition", v === "fade" ? undefined : v))}
          >
            <SelectTrigger id="slide-transition" className="h-8" data-testid="slide-transition">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SLIDE_TRANSITIONS.map((t) => (
                <SelectItem key={t} value={t}>
                  {m.transitions[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-faint">{m.transitionHint}</p>
        </div>
      </div>
    </details>
  );
}

function ImageBackground({
  background,
  onChange,
}: {
  background: Extract<SlideBackground, { kind: "image" }>;
  onChange: (next: SlideBackground) => void;
}) {
  const fileRef = React.useRef<HTMLInputElement>(null);
  const { upload, busy } = useAssetUpload();
  const assetUrl = useAssetUrl();

  async function onFile(file: File) {
    const result = await upload(file);
    if ("assetId" in result) onChange({ ...background, assetId: result.assetId });
    else toast.error(result.error);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {background.assetId && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={assetUrl(background.assetId)} alt="" className="h-10 w-16 rounded border border-border object-cover" />
        )}
        <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={() => fileRef.current?.click()} data-testid="slide-bg-image-pick">
          <ImagePlus aria-hidden="true" />
          {busy ? m.uploading : background.assetId ? m.replaceImage : m.pickImage}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          data-testid="slide-bg-image-input"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void onFile(file);
          }}
        />
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-small">
          <span className="font-medium text-foreground">{m.overlay}</span>
          <span className="font-mono tabular-nums text-muted-foreground">{Math.round(background.overlay * 100)} %</span>
        </div>
        <Slider
          min={0}
          max={90}
          step={5}
          value={[Math.round(background.overlay * 100)]}
          thumbLabel={m.overlay}
          onValueChange={([v]) => onChange({ ...background, overlay: v / 100 })}
        />
        <p className="text-xs text-faint">{m.overlayHint}</p>
      </div>
    </div>
  );
}
