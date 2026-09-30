"use client";

import { useEffect } from "react";
import { monitoring } from "@/lib/monitoring";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    monitoring.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Une erreur inattendue est survenue</h2>
          <p className="text-zinc-500 mb-8 max-w-md">
            Nous avons été notifiés du problème et nous travaillons à le résoudre.
          </p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
