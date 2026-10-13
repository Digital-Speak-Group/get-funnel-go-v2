import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { onboardingMessages } from "./messages";

const m = onboardingMessages.slug;

interface SlugFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

/** Slug input with a fixed `getfunnels.io/` prefix sharing one field outline. */
export function SlugField({ value, onChange, error, disabled }: SlugFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="slug">{m.label}</Label>
      <div
        className={cn(
          "flex h-10 items-stretch overflow-hidden rounded-md border bg-surface transition-colors duration-150",
          "focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/25",
          error ? "border-danger" : "border-border-strong",
          disabled && "opacity-50"
        )}
      >
        <span className="flex items-center border-r border-border bg-surface-2 px-3 font-mono text-small text-faint">
          {m.prefix}
        </span>
        <Input
          id="slug"
          name="slug"
          type="text"
          required
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value.toLowerCase())}
          placeholder={m.placeholder}
          disabled={disabled}
          maxLength={50}
          pattern="^[a-z0-9-]+$"
          aria-invalid={error ? true : undefined}
          aria-describedby="slug-message"
          className="h-full rounded-none border-0 bg-transparent font-mono focus-visible:ring-0 disabled:opacity-100"
        />
      </div>
      <p id="slug-message" className={cn("text-small", error ? "text-danger" : "text-faint")}>
        {error ?? m.hint}
      </p>
    </div>
  );
}
