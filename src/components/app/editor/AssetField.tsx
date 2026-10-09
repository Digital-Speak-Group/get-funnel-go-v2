"use client";

import * as React from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ASSET_MESSAGES as m } from "./messages";

interface AssetFieldProps {
  path: string;
  value?: string;
  error?: string[];
  onChange: (next: string | undefined) => void;
}

/** Image picker for an `assetId`: uploads to the org's storage and stores the returned id. */
export function AssetField({ path, value, error, onChange }: AssetFieldProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const id = `field-${path.replace(/\./g, "-")}`;

  async function upload(file: File) {
    setBusy(true);
    setUploadError(null);
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch("/api/assets", { method: "POST", body });
      const data: { assetId?: string; error?: string } = await res.json().catch(() => ({}));
      if (res.ok && data.assetId) onChange(data.assetId);
      else setUploadError(m.errors[data.error ?? ""] ?? m.errors.FAILED);
    } catch {
      setUploadError(m.errors.FAILED);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const message = uploadError ?? error?.[0];

  return (
    <div className="space-y-1.5" data-testid={`slide-field-${path}`}>
      <span className="text-sm font-medium text-foreground">{m.label}</span>
      {value && (
        <div className="relative aspect-video w-full overflow-hidden rounded-md border border-border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element -- private, access-checked route */}
          <img src={`/api/assets/${value}`} alt="" className="absolute inset-0 h-full w-full object-contain" />
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="sr-only"
          data-testid={`slide-upload-${path}`}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
          }}
        />
        <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={() => inputRef.current?.click()}>
          <ImagePlus aria-hidden="true" />
          {busy ? m.uploading : value ? m.replace : m.upload}
        </Button>
        {value && (
          <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => onChange(undefined)}>
            <Trash2 aria-hidden="true" />
            {m.remove}
          </Button>
        )}
      </div>
      <p className="text-xs text-faint">{m.hint}</p>
      {message && (
        <p role="alert" className="text-xs text-danger" data-testid={`slide-error-${path}`}>
          {message}
        </p>
      )}
    </div>
  );
}
