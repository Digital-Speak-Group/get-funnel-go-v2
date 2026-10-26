"use client";

import * as React from "react";
import { Maximize2, Minimize2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SlideThumbnail } from "@/components/slides/SlideThumbnail";
import { toast } from "sonner";
import {
  SlideEditProvider,
  type ItemAction,
  type SlideImageApi,
  type SlideItemApi,
} from "@/components/slides/editable";
import { useAssetUpload } from "./asset-upload";
import { FreeEditor } from "./free/FreeEditor";
import { ZoomControl, useCanvasZoom } from "./ZoomControl";
import { RewriteMenu } from "./RewriteMenu";
import { rewriteTarget } from "./rewrite-target";
import { RichTextField } from "./free/RichTextField";
import { RichTextChangeContext } from "./free/rich-editors";
import type { RichText } from "@/lib/slides/rich-text";
import { ConvertToFreeButton } from "./free/ConvertToFreeButton";
import { convertRenderedSlide } from "./free/convert";
import type { FreeElement } from "@/lib/slides/free";
import { canApply, listBounds } from "./list-actions";
import type { ThemeTokens } from "@/lib/slides/theme";
import type { Slide } from "@/lib/slides/schema";
import { ASSET_MESSAGES, CANVAS_MESSAGES, ITEM_MESSAGES, SLIDE_TYPE_LABELS, fieldLabel } from "./messages";
import type { EditorSlide } from "./validation";

interface SlideCanvasProps {
  deckId: string;
  slide: EditorSlide | null;
  theme: ThemeTokens;
  /** A text edited directly on the slide: its content path and new value. */
  onEditText: (path: string, value: string) => void;
  /** A freeform text's new rich text (Task 76), by element path (`elements.3`). */
  onEditRich: (path: string, rich: RichText) => void;
  /** Move, duplicate or delete an item of the list at `path`. */
  onItemAction: (path: string, action: ItemAction, index: number) => void;
  /** An image picked (asset id) or removed (undefined) on the slide, at its `assetId` path. */
  onSetImage: (path: string, assetId: string | undefined) => void;
  /** New element list of a freeform slide (moved, resized, added, styled…), with its undo group. */
  onFreeChange: (elements: FreeElement[], group?: string) => void;
  /** Turns the current structured slide into a freeform one with these elements. */
  onConvertToFree: (elements: FreeElement[]) => void;
  /** The editor's undo (the rewrite toast uses it). */
  onUndo: () => void;
  /** Inspector hidden so the slide gets the room to edit on. */
  focused: boolean;
  onToggleFocus: () => void;
}

/** Field label of the last named segment: `painPoints.0.title` → label of `title`. */
const placeholderFor = (path: string) =>
  // Table cells (freeform, Task 78) say "Cellule", not the label of `rows`.
  /\.rows\.\d+\.\d+$/.test(path) ? CANVAS_MESSAGES.cell : fieldLabel(path.split(".").filter((p) => !/^\d+$/.test(p)).pop() ?? path);

export function SlideCanvas({
  deckId,
  slide,
  theme,
  onEditText,
  onEditRich,
  onItemAction,
  onSetImage,
  onFreeChange,
  onConvertToFree,
  focused,
  onToggleFocus,
  onUndo,
}: SlideCanvasProps) {
  const type = slide?.type;
  const items = React.useMemo<SlideItemApi | undefined>(
    () =>
      type && {
        can: (path, action, index, length) => canApply(action, index, length, listBounds(type, path)),
        act: onItemAction,
        label: (action) => ITEM_MESSAGES[action],
      },
    [type, onItemAction]
  );

  const canvasRef = React.useRef<HTMLDivElement>(null);
  // The text last clicked into on the slide: what "Réécrire" works on (Task 79).
  const [rewritePath, setRewritePath] = React.useState<string | null>(null);
  React.useEffect(() => setRewritePath(null), [slide?.id]);
  const stageRef = React.useRef<HTMLDivElement>(null);
  // The canvas element changes when the slide switches between freeform and structured.
  const zoom = useCanvasZoom(stageRef, canvasRef, slide ? (slide.type === "free" ? "free" : "flat") : undefined);

  // One hidden file input serves every image on the slide; `pending` is the path it fills.
  const fileRef = React.useRef<HTMLInputElement>(null);
  const pending = React.useRef<string | null>(null);
  const { upload } = useAssetUpload();
  const images = React.useMemo<SlideImageApi>(
    () => ({
      pick: (path) => {
        pending.current = path;
        fileRef.current?.click();
      },
      remove: (path) => onSetImage(path, undefined),
      label: (action) =>
        action === "add"
          ? ASSET_MESSAGES.canvasAdd
          : action === "replace"
            ? ASSET_MESSAGES.canvasReplace
            : ASSET_MESSAGES.canvasRemove,
    }),
    [onSetImage]
  );

  async function uploadPicked(file: File) {
    const path = pending.current;
    if (!path) return;
    const toastId = toast.loading(ASSET_MESSAGES.uploading);
    const result = await upload(file);
    toast.dismiss(toastId);
    if ("assetId" in result) onSetImage(path, result.assetId);
    else toast.error(result.error);
  }

  if (!slide) {
    return (
      <div
        data-testid="editor-empty"
        className="flex aspect-video flex-col items-center justify-center rounded-lg border border-dashed border-border-strong bg-surface-2/40 p-6 text-center"
      >
        <div className="mb-3 flex size-12 items-center justify-center rounded-lg border border-primary/30 bg-primary/15">
          <Sparkles className="size-6 text-brand" aria-hidden="true" />
        </div>
        <h2 className="text-h3 text-foreground">{CANVAS_MESSAGES.emptyTitle}</h2>
        <p className="mt-1 max-w-sm text-small text-muted-foreground">{CANVAS_MESSAGES.emptyBody}</p>
      </div>
    );
  }

  // Zoomed past fit, the slide scrolls inside the stage (both ways) instead of the page. Not
  // below: a scroll box would clip the freeform handles that stick out of the slide.
  const viewportClass = cn(zoom.zoom > 1 && "max-h-[calc(100dvh-14rem)] overflow-auto");

  const preview = {
    id: slide.id,
    position: slide.position,
    type: slide.type,
    content: slide.content,
    notes: slide.notes || undefined,
    script: slide.script || undefined,
    layout: slide.layout,
  } as unknown as Slide;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 text-small text-muted-foreground">
        <span data-testid="canvas-caption" className="min-w-0 truncate whitespace-nowrap">
          Slide {slide.position + 1} — {SLIDE_TYPE_LABELS[slide.type]}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          <span className="hidden whitespace-nowrap text-small text-faint 2xl:inline">{CANVAS_MESSAGES.hint}</span>
          <RewriteMenu
            deckId={deckId}
            target={rewritePath ? rewriteTarget(slide, rewritePath) : null}
            onEditText={onEditText}
            onEditRich={onEditRich}
            onUndo={onUndo}
          />
          {slide.type !== "free" && (
            <ConvertToFreeButton
              onConvert={() => {
                const root = canvasRef.current?.querySelector<HTMLElement>('[role="group"]');
                if (root) onConvertToFree(convertRenderedSlide(root, slide.content, theme));
              }}
            />
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onToggleFocus}
            aria-pressed={focused}
            aria-label={focused ? CANVAS_MESSAGES.unfocus : CANVAS_MESSAGES.focus}
            title={focused ? CANVAS_MESSAGES.unfocus : CANVAS_MESSAGES.focus}
            className="hidden lg:inline-flex"
            data-testid="canvas-focus"
          >
            {focused ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}
          </Button>
        </div>
      </div>
      {/* Neutral stage around the canvas, so any theme (light or dark) reads as "the slide". */}
      <div ref={stageRef} className="rounded-lg border border-border bg-surface-2/50 p-3 lg:p-5" data-testid="editor-stage">
        {slide.type === "free" ? (
          <FreeEditor
            slideId={slide.id}
            elements={(slide.content.elements as FreeElement[] | undefined) ?? []}
            theme={theme}
            onChange={onFreeChange}
            onPickImage={images.pick}
            viewportClassName={viewportClass}
          >
            {renderCanvas()}
          </FreeEditor>
        ) : (
          <div className={viewportClass}>{renderCanvas()}</div>
        )}
      </div>
      <div className="flex justify-end">
        <ZoomControl zoom={zoom} />
      </div>
    </div>
  );

  function renderCanvas() {
    return (
      <div
        ref={canvasRef}
        data-testid="slide-canvas"
        onFocusCapture={(e) => {
          const path = (e.target as HTMLElement).closest<HTMLElement>("[data-edit-path]")?.dataset.editPath;
          if (path) setRewritePath(path);
        }}
        className="relative mx-auto aspect-video shrink-0 overflow-hidden rounded-md bg-surface shadow-pop"
        style={{ width: `${zoom.zoom * 100}%` }}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          data-testid="canvas-image-input"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void uploadPicked(file);
          }}
        />
        <RichTextChangeContext.Provider value={onEditRich}>
          <SlideEditProvider onEdit={onEditText} placeholderFor={placeholderFor} items={items} images={images} richText={RichTextField}>
            <SlideThumbnail slide={preview} theme={theme} className="absolute inset-0 h-full w-full" />
          </SlideEditProvider>
        </RichTextChangeContext.Provider>
      </div>
    );
  }
}
