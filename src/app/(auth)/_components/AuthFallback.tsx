import { LoaderCircle } from "lucide-react";
import { authMessages } from "../messages";

/** Suspense fallback / pending state for the auth screens. */
export function AuthFallback({ label = authMessages.loading }: { label?: string }) {
  return (
    <div role="status" className="flex flex-col items-center gap-3 py-12 text-center">
      <LoaderCircle className="size-6 animate-spin text-faint" aria-hidden="true" />
      <p className="text-small text-muted-foreground">{label}</p>
    </div>
  );
}
