"use client";

import * as React from "react";
import Link from "next/link";
import { Copy, MoreHorizontal, PenLine, Play, SquarePen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { dashboardMessages as m } from "./messages";

interface DeckActionsMenuProps {
  deckId: string;
  duplicating: boolean;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function DeckActionsMenu({ deckId, duplicating, onRename, onDuplicate, onDelete }: DeckActionsMenuProps) {
  // Rename and delete move focus elsewhere (inline input, dialog); don't pull it back to the trigger.
  const keepFocusAway = React.useRef(false);
  const handOff = (action: () => void) => () => {
    keepFocusAway.current = true;
    action();
  };

  return (
    // Non-modal so a dialog opened from an item doesn't inherit the menu's pointer lock.
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={m.card.more}
          className="shrink-0 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100 md:data-[state=open]:opacity-100"
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48"
        onCloseAutoFocus={(event) => {
          if (keepFocusAway.current) event.preventDefault();
          keepFocusAway.current = false;
        }}
      >
        <DropdownMenuItem asChild>
          <Link href={`/app/decks/${deckId}`}>
            <SquarePen aria-hidden="true" />
            {m.card.open}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/present/${deckId}`}>
            <Play aria-hidden="true" />
            {m.card.present}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handOff(onRename)}>
          <PenLine aria-hidden="true" />
          {m.card.rename}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onDuplicate} disabled={duplicating}>
          <Copy aria-hidden="true" />
          {duplicating ? m.card.duplicating : m.card.duplicate}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handOff(onDelete)} className="text-danger focus:text-danger [&_svg]:text-danger">
          <Trash2 aria-hidden="true" />
          {m.card.delete}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
