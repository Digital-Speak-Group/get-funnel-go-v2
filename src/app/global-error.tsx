"use client";

import { useEffect } from "react";
import { monitoring } from "@/lib/monitoring";
// Replaces the root layout, so it brings its own styles (tokens).
import "@/styles/globals.css";

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
    <html lang="fr">
      <body className="bg-background text-foreground antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
          <h2 className="mb-4 text-h1 text-foreground">Une erreur inattendue est survenue</h2>
          <p className="mb-8 max-w-md text-muted-foreground">
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
