import * as React from "react";
import { cn } from "@/lib/utils";
import { fieldBase } from "./input";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(fieldBase, "flex min-h-20 py-2 leading-relaxed", className)}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export { Textarea };
