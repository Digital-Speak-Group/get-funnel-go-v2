"use client";

import * as React from "react";
import { ClipboardPaste, Copy, CopyPlus, Group, Layers, Lock, LockOpen, Scissors, Trash2, Ungroup } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { FREE_MESSAGES as m } from "../messages";
import type { Alignment } from "./free-ops";
import type { FreeActions } from "./useFreeActions";

const ALIGNMENTS: Alignment[] = ["left", "center", "right", "top", "middle", "bottom"];
/** Menus keep focus where it went, not back on the canvas. */
const keepFocus = (event: Event) => event.preventDefault();

/** Right-click menu of the freeform canvas (Task 70): same actions as the toolbar and shortcuts. */
export function FreeContextMenu({ actions, children }: { actions: FreeActions; children: React.ReactNode }) {
  const a = actions;
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent onCloseAutoFocus={keepFocus} data-testid="free-context-menu">
        {a.hasSelection && (
          <>
            <ContextMenuItem onSelect={a.copy}>
              <Copy aria-hidden="true" />
              {m.copy}
              <ContextMenuShortcut>Ctrl+C</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onSelect={a.cut} disabled={a.lockedAll}>
              <Scissors aria-hidden="true" />
              {m.cut}
              <ContextMenuShortcut>Ctrl+X</ContextMenuShortcut>
            </ContextMenuItem>
          </>
        )}
        <ContextMenuItem onSelect={a.paste} disabled={!a.canPaste()}>
          <ClipboardPaste aria-hidden="true" />
          {m.paste}
          <ContextMenuShortcut>Ctrl+V</ContextMenuShortcut>
        </ContextMenuItem>
        {a.hasSelection ? (
          <>
            <ContextMenuItem onSelect={a.duplicate}>
              <CopyPlus aria-hidden="true" />
              {m.duplicate}
              <ContextMenuShortcut>Ctrl+D</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onSelect={a.remove} disabled={a.lockedAll}>
              <Trash2 aria-hidden="true" />
              {m.remove}
              <ContextMenuShortcut>Suppr</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuSeparator />
            {a.grouped ? (
              <ContextMenuItem onSelect={a.ungroup}>
                <Ungroup aria-hidden="true" />
                {m.ungroup}
                <ContextMenuShortcut>Ctrl+⇧+G</ContextMenuShortcut>
              </ContextMenuItem>
            ) : (
              <ContextMenuItem onSelect={a.group} disabled={!a.canGroup}>
                <Group aria-hidden="true" />
                {m.group}
                <ContextMenuShortcut>Ctrl+G</ContextMenuShortcut>
              </ContextMenuItem>
            )}
            <ContextMenuItem onSelect={a.toggleLock} data-testid="free-menu-lock">
              {a.lockedAll ? <LockOpen aria-hidden="true" /> : <Lock aria-hidden="true" />}
              {a.lockedAll ? m.unlock : m.lock}
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <Layers aria-hidden="true" />
                {m.arrange}
              </ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem onSelect={() => a.arrange("front")}>{m.front}</ContextMenuItem>
                <ContextMenuItem onSelect={() => a.arrange("forward")}>{m.forward}</ContextMenuItem>
                <ContextMenuItem onSelect={() => a.arrange("backward")}>{m.backward}</ContextMenuItem>
                <ContextMenuItem onSelect={() => a.arrange("back")}>{m.back}</ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuSub>
              <ContextMenuSubTrigger disabled={a.lockedAll}>{m.alignMenu}</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                {ALIGNMENTS.map((to) => (
                  <ContextMenuItem key={to} onSelect={() => a.align(to)}>
                    {m.alignSelection[to]}
                  </ContextMenuItem>
                ))}
                <ContextMenuSeparator />
                <ContextMenuItem disabled={!a.canDistribute} onSelect={() => a.distribute("horizontal")}>
                  {m.distribute.horizontal}
                </ContextMenuItem>
                <ContextMenuItem disabled={!a.canDistribute} onSelect={() => a.distribute("vertical")}>
                  {m.distribute.vertical}
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </>
        ) : (
          <ContextMenuItem onSelect={a.selectAll}>
            {m.selectAll}
            <ContextMenuShortcut>Ctrl+A</ContextMenuShortcut>
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
