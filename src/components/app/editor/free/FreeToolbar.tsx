"use client";

import * as React from "react";
import { Blend, Copy, ImagePlus, Layers, Lock, LockOpen, Plus, Trash2, Video } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { FreeElement } from "@/lib/slides/free";
import type { ThemeTokens } from "@/lib/slides/theme";
import { FREE_MESSAGES as m } from "../messages";
import { updateElements, type Alignment, type NewElementKind } from "./free-ops";
import type { FreeActions, FreeCommit } from "./useFreeActions";
import { ColorPicker, IconPicker, TextControls } from "./StyleControls";
import { RevealControl } from "./RevealControl";
import { BorderControl, ShadowControl } from "./ShapeControls";
import { ChartControls, TableControls, VideoDialog } from "./DataControls";
import { RichMarks } from "./RichMarks";
import { TextSpacing, type SpacingPatch } from "./TextSpacing";

interface FreeToolbarProps {
  theme: ThemeTokens;
  elements: FreeElement[];
  selected: FreeElement[];
  /** Selection actions shared with the right-click menu and shortcuts. */
  actions: FreeActions;
  /** False when the slide is full (60 elements). */
  onAdd: (kind: NewElementKind) => boolean;
  /** A change to record in the history and save. */
  onChange: FreeCommit;
  /** Element id whose panel (chart data, video link) is open, or NEW_VIDEO_PANEL; a double-click opens it too. */
  panel: string | null;
  onPanelChange: (panel: string | null) => void;
  onAddVideo: (video: { provider: "youtube" | "vimeo"; videoId: string }) => void;
  onPickImage: (id: string) => void;
}

/** Menus keep focus where it went (often a text being typed in), not back on their button. */
const keepFocus = (event: Event) => event.preventDefault();

const ADD_GROUPS: { label: keyof typeof m.addGroups; kinds: NewElementKind[] }[] = [
  { label: "content", kinds: ["text", "image", "icon"] },
  { label: "data", kinds: ["table", "chart"] },
  { label: "shapes", kinds: ["rect", "ellipse", "line", "triangle", "diamond", "arrow", "star", "bubble"] },
];
/** The video dialog when it adds a new video (else it is open for the selected video's id). */
export const NEW_VIDEO_PANEL = "new-video";
const ALIGNMENTS: Alignment[] = ["left", "center", "right", "top", "middle", "bottom"];

/** Toolbar above a freeform slide: add elements, then style and arrange the selection. */
export function FreeToolbar({
  theme,
  elements,
  selected,
  actions,
  onAdd,
  onChange,
  onPickImage,
  panel,
  onPanelChange,
  onAddVideo,
}: FreeToolbarProps) {
  const ids = selected.map((e) => e.id);
  const kinds = new Set(selected.map((e) => e.kind));
  const only = kinds.size === 1 ? [...kinds][0] : null;
  const first = selected[0];
  const patch = (fn: (e: FreeElement) => FreeElement) => onChange(updateElements(elements, ids, fn));

  // One line, never wrapping: a toolbar that grew on selection would shift the slide under
  // the pointer between the two clicks of a double-click.
  return (
    <div
      role="toolbar"
      aria-label={m.toolbarLabel}
      data-testid="free-toolbar"
      className="flex h-10 flex-nowrap items-center gap-1 overflow-x-auto rounded-lg border border-border bg-surface p-1 [&>*]:shrink-0"
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" size="sm" variant="secondary" data-testid="free-add">
            <Plus aria-hidden="true" />
            {m.add}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" onCloseAutoFocus={keepFocus}>
          {ADD_GROUPS.map((group, i) => (
            <React.Fragment key={group.label}>
              {i > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel>{m.addGroups[group.label]}</DropdownMenuLabel>
              {group.kinds.map((kind) => (
                <DropdownMenuItem
                  key={kind}
                  data-testid={`free-add-${kind}`}
                  onSelect={() => {
                    if (!onAdd(kind)) toast.error(m.limit);
                  }}
                >
                  {m.addKinds[kind]}
                </DropdownMenuItem>
              ))}
              {group.label === "data" && (
                <DropdownMenuItem data-testid="free-add-video" onSelect={() => onPanelChange(NEW_VIDEO_PANEL)}>
                  {m.video.add}
                </DropdownMenuItem>
              )}
            </React.Fragment>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {only === "text" && first?.kind === "text" && (
        <>
          <TextControls text={first} patch={patch} theme={theme} wholeBold={selected.length > 1 || first.weight === "bold"} />
          {selected.length === 1 && <RichMarks path={`elements.${elements.findIndex((e) => e.id === first.id)}`} />}
          <TextSpacing
            text={first}
            onChange={(spacing: SpacingPatch, group) =>
              onChange(
                updateElements(elements, ids, (e) => (e.kind === "text" ? { ...e, ...spacing } : e)),
                `${group}:${ids.join()}`
              )
            }
          />
        </>
      )}
      {only === "shape" && first?.kind === "shape" && (
        <>
          <ColorPicker
            label={m.fill}
            value={first.fill ?? "primary"}
            theme={theme}
            onChange={(fill) => patch((e) => (e.kind === "shape" ? { ...e, fill } : e))}
            compact
          />
          <BorderControl
            shape={first}
            theme={theme}
            onChange={(border, group) =>
              onChange(updateElements(elements, ids, (e) => (e.kind === "shape" ? { ...e, ...border } : e)), group && `${group}:${ids.join()}`)
            }
          />
        </>
      )}
      {selected.length === 1 && first?.kind === "table" && (
        <TableControls
          table={first}
          theme={theme}
          onChange={(next, group) => onChange(updateElements(elements, [first.id], () => next), group && `${group}:${first.id}`)}
        />
      )}
      {selected.length === 1 && first?.kind === "chart" && (
        <ChartControls
          chart={first}
          theme={theme}
          open={panel === first.id}
          onOpenChange={(open) => onPanelChange(open ? first.id : null)}
          onChange={(next, group) => onChange(updateElements(elements, [first.id], () => next), group && `${group}:${first.id}`)}
        />
      )}
      {selected.length === 1 && first?.kind === "video" && (
        <Button type="button" size="sm" variant="ghost" onClick={() => onPanelChange(first.id)} data-testid="free-video-change">
          <Video aria-hidden="true" />
          {m.video.change}
        </Button>
      )}
      <VideoDialog
        open={panel === NEW_VIDEO_PANEL || elements.some((e) => e.id === panel && e.kind === "video")}
        onOpenChange={(open) => {
          if (!open) onPanelChange(null);
        }}
        onConfirm={(video) => {
          if (panel === NEW_VIDEO_PANEL) return onAddVideo(video);
          if (panel) onChange(updateElements(elements, [panel], (e) => (e.kind === "video" ? { ...e, ...video } : e)));
        }}
      />
      {only === "icon" && first?.kind === "icon" && (
        <>
          <IconPicker value={first.icon} onChange={(icon) => patch((e) => (e.kind === "icon" ? { ...e, icon } : e))} />
          <ColorPicker
            label={m.color}
            value={first.color ?? "primary"}
            theme={theme}
            onChange={(color) => patch((e) => (e.kind === "icon" ? { ...e, color } : e))}
            compact
          />
        </>
      )}
      {only === "image" && first?.kind === "image" && selected.length === 1 && (
        <>
          <Button type="button" size="icon-sm" variant="ghost" onClick={() => onPickImage(first.id)} data-testid="free-pick-image" aria-label={m.image} title={m.image}>
            <ImagePlus aria-hidden="true" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            aria-pressed={first.fit === "contain"}
            onClick={() => patch((e) => (e.kind === "image" ? { ...e, fit: e.fit === "contain" ? "cover" : "contain" } : e))}
          >
            {first.fit === "contain" ? m.fit.contain : m.fit.cover}
          </Button>
        </>
      )}

      {selected.length > 0 && (
        <>
          <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" size="icon-sm" variant="ghost" data-testid="free-arrange" aria-label={m.arrange} title={m.arrange}>
                <Layers aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" onCloseAutoFocus={keepFocus}>
              <DropdownMenuItem onSelect={() => actions.arrange("front")}>{m.front}</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => actions.arrange("forward")}>{m.forward}</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => actions.arrange("backward")}>{m.backward}</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => actions.arrange("back")}>{m.back}</DropdownMenuItem>
              <DropdownMenuSeparator />
              {ALIGNMENTS.map((to) => (
                <DropdownMenuItem key={to} disabled={actions.lockedAll} onSelect={() => actions.align(to)}>
                  {m.alignSelection[to]}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem disabled={!actions.canDistribute} onSelect={() => actions.distribute("horizontal")}>
                {m.distribute.horizontal}
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!actions.canDistribute} onSelect={() => actions.distribute("vertical")}>
                {m.distribute.vertical}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {actions.grouped ? (
                <DropdownMenuItem onSelect={actions.ungroup} data-testid="free-ungroup">
                  {m.ungroup}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem disabled={!actions.canGroup} onSelect={actions.group} data-testid="free-group">
                  {m.group}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label={m.duplicate}
            title={`${m.duplicate} (Ctrl+D)`}
            onClick={actions.duplicate}
          >
            <Copy aria-hidden="true" />
          </Button>
          <RevealControl elements={elements} selected={selected} onChange={onChange} />
          <ShadowControl value={first?.shadow} onChange={(shadow) => onChange(updateElements(elements, ids, (e) => ({ ...e, shadow })))} />
          <OpacityControl
            value={first?.opacity ?? 1}
            onChange={(opacity) =>
              onChange(
                updateElements(elements, ids, (e) => ({ ...e, opacity: opacity >= 1 ? undefined : opacity })),
                `opacity:${ids.join()}`
              )
            }
          />
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label={actions.lockedAll ? m.unlock : m.lock}
            title={actions.lockedAll ? m.unlock : m.lock}
            aria-pressed={actions.lockedAll}
            className={cn(actions.lockedAll && "bg-surface-3 text-foreground")}
            data-testid="free-lock"
            onClick={actions.toggleLock}
          >
            {actions.lockedAll ? <Lock aria-hidden="true" /> : <LockOpen aria-hidden="true" />}
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label={m.remove}
            title={`${m.remove} (Suppr)`}
            data-testid="free-remove"
            disabled={actions.lockedAll}
            onClick={actions.remove}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </>
      )}

      <span className="ml-auto hidden text-small text-faint xl:inline">{selected.length === 0 ? m.hint : null}</span>
    </div>
  );
}

/** Opacity of the selection, 10–100 %; one undo step per slider drag. */
function OpacityControl({ value, onChange }: { value: number; onChange: (opacity: number) => void }) {
  const percent = Math.round(value * 100);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" size="sm" variant="ghost" aria-label={`${m.opacity} : ${percent} %`} title={m.opacity} data-testid="free-opacity">
          <Blend aria-hidden="true" />
          <span className="font-mono text-xs tabular-nums">{percent}%</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 space-y-2 p-3" onCloseAutoFocus={keepFocus}>
        <div className="flex items-center justify-between text-small">
          <span className="font-medium text-foreground">{m.opacity}</span>
          <span className="font-mono tabular-nums text-muted-foreground">{percent} %</span>
        </div>
        <Slider
          min={10}
          max={100}
          step={5}
          value={[percent]}
          thumbLabel={m.opacity}
          onValueChange={([next]) => onChange(next / 100)}
        />
      </PopoverContent>
    </Popover>
  );
}
