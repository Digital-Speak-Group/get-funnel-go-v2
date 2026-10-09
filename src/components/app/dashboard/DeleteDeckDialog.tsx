"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { dashboardMessages as m } from "./messages";

interface DeleteDeckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deckTitle: string;
  pending: boolean;
  onConfirm: () => void;
}

export function DeleteDeckDialog({ open, onOpenChange, deckTitle, pending, onConfirm }: DeleteDeckDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="max-w-md" role="alertdialog">
        <DialogHeader>
          <DialogTitle>{m.deleteDialog.title}</DialogTitle>
          <DialogDescription>{m.deleteDialog.description(deckTitle)}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={pending}>
            {m.card.cancel}
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={pending} autoFocus>
            {pending ? m.deleteDialog.pending : m.deleteDialog.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
