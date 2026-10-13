"use client";

import * as React from "react";
import { Maximize2, Minimize2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { ConvertToFreeButton } from "./free/ConvertToFreeButton";
import { convertRenderedSlide } from "./free/convert";
import type { FreeElement } from "@/lib/slides/free";
import { canApply, listBounds } from "./list-actions";
import type { ThemeTokens } from "@/lib/slides/theme";
import type { Slide } from "@/lib/slides/schema";
import { ASSET_MESSAGES, CANVAS_MESSAGES, ITEM_MESSAGES, SLIDE_TYPE_LABELS, fieldLabel } from "./messages";
import type { EditorSlide } from "./validation";

interface SlideCanvasProps {
  slide: EditorSlide | null;
  theme: ThemeTokens;
  /** A text edited directly on the slide: its content path and new value. */
  onEditText: (path: string, value: string) => void;
  /** Move, duplicate or delete an item of the list at `path`. */
  onItemAction: (path: string, action: ItemAction, index: number) => void;
  /** An image picked (asset id) or removed (undefined) on the slide, at its `assetId` path. */
  onSetImage: (path: string, assetId: string | undefined) => void;
  /** New element list of a freeform slide (moved, resized, added, styled…). */
  onFreeChange: (elements: FreeElement[]) => void;
  /** Turns the current structured slide into a freeform one with these elements. */
  onConvertToFree: (elements: FreeElement[]) => void;
  /** Inspector hidden so the slide gets the room to edit on. */
  focused: boolean;
  onToggleFocus: () => void;
}

/** Field label of the last named segment: `painPoints.0.title` → label of `title`. */
const placeholderFor = (path: string) => fieldLabel(path.split(".").filter((p) => !/^\d+$/.test(p)).pop() ?? path);

export function SlideCanvas({
  slide,
  theme,
  onEditText,
  onItemAction,
  onSetImage,
  onFreeChange,
  onConvertToFree,
  focused,
  onToggleFocus,
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
        className="flex aspect-video flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-800 text-center"
      >
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600/15">
          <Sparkles className="h-6 w-6 text-violet-400" />
        </div>
        <h2 className="text-lg font-semibold text-white">
          Ce deck n’a pas encore de slide
        </h2>
        <p className="mt-1 max-w-sm text-sm text-zinc-400">
          Ajoutez un slide dans la liste à gauche pour commencer à construire
          votre présentation.
        </p>
      </div>
    );
  }

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
      <div className="flex items-center justify-between text-sm text-zinc-400">
        <span data-testid="canvas-caption">
          Slide {slide.position + 1} — {SLIDE_TYPE_LABELS[slide.type]}
        </span>
        <div className="flex items-center gap-2">
          <span className="hidden text-small text-faint xl:inline">{CANVAS_MESSAGES.hint}</span>
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
            size="sm"
            onClick={onToggleFocus}
            aria-pressed={focused}
            className="hidden lg:inline-flex"
            data-testid="canvas-focus"
          >
            {focused ? <Minimize2 /> : <Maximize2 />}
            {focused ? CANVAS_MESSAGES.unfocus : CANVAS_MESSAGES.focus}
          </Button>
        </div>
      </div>
      {slide.type === "free" ? (
        <FreeEditor
          slideId={slide.id}
          elements={(slide.content.elements as FreeElement[] | undefined) ?? []}
          theme={theme}
          onChange={onFreeChange}
          onPickImage={images.pick}
        >
          {renderCanvas()}
        </FreeEditor>
      ) : (
        renderCanvas()
      )}
    </div>
  );

  function renderCanvas() {
    return (
      <div
        ref={canvasRef}
        data-testid="slide-canvas"
        className="relative aspect-video overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900"
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
        <SlideEditProvider onEdit={onEditText} placeholderFor={placeholderFor} items={items} images={images}>
          <SlideThumbnail
            slide={preview}
            theme={theme}
            className="absolute inset-0 h-full w-full"
          />
        </SlideEditProvider>
      </div>
    );
  }
}
