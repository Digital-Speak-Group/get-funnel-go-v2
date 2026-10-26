import { CircleAlert } from "lucide-react";

/** Form-level error (server response), announced on appearance. */
export function FormAlert({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-md border border-danger/25 bg-danger/10 px-3 py-2.5 text-small text-danger"
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
