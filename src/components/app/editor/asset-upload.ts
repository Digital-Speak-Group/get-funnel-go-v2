"use client";

import * as React from "react";
import { ASSET_MESSAGES as m } from "./messages";

export type UploadResult = { assetId: string } | { error: string };

/** Uploads an image to the org's storage: the new asset id, or the French error message (also kept in `error`). */
export function useAssetUpload() {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const upload = React.useCallback(async (file: File): Promise<UploadResult> => {
    const fail = (message: string) => {
      setError(message);
      return { error: message };
    };
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch("/api/assets", { method: "POST", body });
      const data: { assetId?: string; error?: string } = await res.json().catch(() => ({}));
      if (res.ok && data.assetId) return { assetId: data.assetId };
      return fail(m.errors[data.error ?? ""] ?? m.errors.FAILED);
    } catch {
      return fail(m.errors.FAILED);
    } finally {
      setBusy(false);
    }
  }, []);

  return { upload, busy, error };
}
