"use client";

import { useState } from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { billingMessages as m } from "./messages";

interface UpgradeDialogProps {
  open: boolean;
  currentPlan: string;
  onClose: () => void;
  /** May return a promise; if it rejects, the button leaves its loading state. */
  onUpgrade: (plan: string) => void | Promise<void>;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Shown when a plan limit blocks an action; suggests the next plan up. */
export function UpgradeDialog({ open, currentPlan, onClose, onUpgrade }: UpgradeDialogProps) {
  const [loading, setLoading] = useState(false);

  const suggestedPlan = currentPlan === "trial" ? "pro" : "agency";
  const suggestedLabel = suggestedPlan === "pro" ? "Pro" : "Agency";

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      await onUpgrade(suggestedPlan);
    } catch {
      setLoading(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (next) return;
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-lg border border-warning/25 bg-warning/10">
            <AlertTriangle className="size-5 text-warning" aria-hidden="true" />
          </div>
          <DialogTitle>{m.limitDialog.title}</DialogTitle>
          <DialogDescription>{m.limitDialog.body(capitalize(currentPlan), suggestedLabel)}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => handleOpenChange(false)}>
            {m.limitDialog.later}
          </Button>
          <Button onClick={handleUpgrade} disabled={loading}>
            {loading ? (
              m.plan.redirecting
            ) : (
              <>
                {m.plan.upgrade(suggestedLabel)}
                <ArrowRight />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
