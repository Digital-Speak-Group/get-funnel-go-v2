"use client";

import * as React from "react";
import { Shapes } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FREE_MESSAGES as m } from "../messages";

/** "Convertir en libre" with a confirmation that says what the slide gains and loses. */
export function ConvertToFreeButton({ onConvert }: { onConvert: () => void }) {
  const [open, setOpen] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm" data-testid="convert-to-free">
          <Shapes aria-hidden="true" />
          {m.convert}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{m.convertTitle}</DialogTitle>
          <DialogDescription>{m.convertDescription}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
            {m.convertCancel}
          </Button>
          <Button
            type="button"
            data-testid="convert-to-free-confirm"
            onClick={() => {
              setOpen(false);
              onConvert();
            }}
          >
            {m.convertConfirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
