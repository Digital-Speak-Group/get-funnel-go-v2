"use client";

import * as React from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      position="bottom-right"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "!rounded-lg !border-border-strong !shadow-pop !font-sans",
          description: "!text-muted-foreground",
          actionButton: "!bg-primary !text-primary-foreground",
          cancelButton: "!bg-surface-3 !text-muted-foreground",
        },
      }}
      style={
        {
          "--normal-bg": "var(--surface-2)",
          "--normal-text": "var(--fg)",
          "--normal-border": "var(--border-strong)",
          "--success-bg": "var(--surface-2)",
          "--success-text": "var(--fg)",
          "--success-border": "var(--border-strong)",
          "--error-bg": "var(--surface-2)",
          "--error-text": "var(--danger)",
          "--error-border": "var(--border-strong)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
}

export { Toaster };
