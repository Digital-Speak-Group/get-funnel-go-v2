import * as React from "react";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface AuthFieldProps extends Omit<React.ComponentProps<typeof Input>, "id" | "name"> {
  id: string;
  label: string;
  /** Inline validation error; marks the input invalid and is announced to screen readers. */
  error?: string;
  /** Helper text shown when there is no error. */
  hint?: string;
  /** Renders the hint as satisfied (success colour + check). */
  hintMet?: boolean;
  /** Extra content on the label row, right-aligned (e.g. "Oublié ?"). */
  labelAside?: React.ReactNode;
}

/** Label + input + inline message, wired with aria-invalid / aria-describedby. */
export function AuthField({ id, label, error, hint, hintMet, labelAside, className, ...props }: AuthFieldProps) {
  const messageId = `${id}-message`;
  const message = error ?? hint;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {labelAside}
      </div>
      <Input
        id={id}
        name={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        className={cn("h-10", className)}
        {...props}
      />
      {message && (
        <p
          id={messageId}
          className={cn(
            "flex items-center gap-1.5 text-small",
            error ? "text-danger" : hintMet ? "text-success" : "text-faint"
          )}
          aria-live={error ? "polite" : undefined}
        >
          {!error && hintMet && <Check className="size-3.5" aria-hidden="true" />}
          {message}
        </p>
      )}
    </div>
  );
}
