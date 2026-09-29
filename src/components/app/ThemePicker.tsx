"use client";

import * as React from "react";
import { systemThemes, type ThemeTokens } from "@/lib/slides/theme";
import { tokensToCssVars, getBackgroundStyles } from "@/lib/slides/theme";
import { cn } from "@/lib/utils";

interface ThemePickerProps {
  selectedThemeId: string;
  onSelect: (themeId: string) => void;
  className?: string;
  variant?: "grid" | "list";
}

function ThemeThumbnail({ theme }: { theme: ThemeTokens }) {
  const cssVars = tokensToCssVars(theme);
  const bgStyles = getBackgroundStyles(theme.background);

  return (
    <div
      style={{
        ...cssVars,
        ...bgStyles,
        position: "relative",
        width: "100%",
        aspectRatio: "16 / 9",
        borderRadius: "8px",
        overflow: "hidden",
        border: "2px solid transparent",
        backgroundColor: theme.color.bg,
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      }}
    >
      <div style={{ padding: "16px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div
          style={{
            height: "24px",
            background: theme.color.primary,
            borderRadius: "4px",
            width: "40%",
            marginBottom: "8px",
          }}
        />
        <div
          style={{
            height: "16px",
            background: theme.color.muted,
            borderRadius: "4px",
            width: "60%",
            marginBottom: "8px",
          }}
        />
        <div
          style={{
            height: "16px",
            background: theme.color.muted,
            borderRadius: "4px",
            width: "80%",
          }}
        />
      </div>
    </div>
  );
}

export function ThemePicker({
  selectedThemeId,
  onSelect,
  className,
  variant = "grid",
}: ThemePickerProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Thème</h3>
        <span className="text-sm text-zinc-400">{systemThemes.length} thèmes système</span>
      </div>

      {variant === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {systemThemes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => onSelect(theme.id)}
              className={cn(
                "relative group p-1 rounded-xl transition-all duration-200",
                selectedThemeId === theme.id
                  ? "ring-2 ring-violet-500 scale-[1.02]"
                  : "opacity-80 hover:opacity-100 hover:scale-[1.01]"
              )}
              style={{
                background: theme.color.surface,
                border: `1px solid ${theme.color.muted}33`,
              }}
              aria-pressed={selectedThemeId === theme.id}
              aria-label={`Sélectionner ${theme.name}`}
            >
              <ThemeThumbnail theme={theme} />
              <div
                className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent"
              >
                <p className="text-xs font-medium text-white truncate">{theme.name}</p>
              </div>
              {selectedThemeId === theme.id && (
                <div className="absolute top-2 right-2">
                  <span
                    className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center text-white text-xs"
                  >
                    ✓
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {systemThemes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => onSelect(theme.id)}
              className={cn(
                "flex items-center gap-4 p-3 rounded-xl transition-all duration-200 w-full text-left",
                selectedThemeId === theme.id
                  ? "bg-violet-600/20 ring-2 ring-violet-500"
                  : "bg-zinc-800/50 hover:bg-zinc-800"
              )}
              style={{ border: `1px solid ${theme.color.muted}33` }}
              aria-pressed={selectedThemeId === theme.id}
            >
              <ThemeThumbnail theme={theme} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{theme.name}</p>
                <p className="text-xs text-zinc-400 capitalize">{theme.id.replace("getfunnels-", "").replace("-", " ")}</p>
              </div>
              {selectedThemeId === theme.id && (
                <span className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center text-white text-xs">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ThemePreview({ theme }: { theme: ThemeTokens }) {
  const cssVars = tokensToCssVars(theme);
  const bgStyles = getBackgroundStyles(theme.background);

  return (
    <div
      style={{
        ...cssVars,
        ...bgStyles,
        position: "relative",
        width: "100%",
        aspectRatio: "16 / 9",
        borderRadius: "12px",
        overflow: "hidden",
        border: `1px solid ${theme.color.muted}33`,
        backgroundColor: theme.color.bg,
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      <div style={{ padding: "32px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
        <h2 style={{ fontSize: "32px", fontWeight: 700, marginBottom: "16px", fontFamily: theme.font.display, color: theme.color.text }}>
          {theme.name}
        </h2>
        <p style={{ fontSize: "18px", color: theme.color.muted, maxWidth: "400px" }}>
          Aperçu du thème avec la typographie, les couleurs et l'arrière-plan appliqués.
        </p>
        <div style={{ marginTop: "24px", display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
          <span
            style={{
              padding: "8px 16px",
              background: theme.color.primary,
              color: theme.color.primaryFg,
              borderRadius: "9999px",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            Primaire
          </span>
          <span
            style={{
              padding: "8px 16px",
              background: theme.color.accent,
              color: theme.color.text,
              borderRadius: "9999px",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            Accent
          </span>
          <span
            style={{
              padding: "8px 16px",
              background: theme.color.surface,
              color: theme.color.text,
              border: `1px solid ${theme.color.muted}33`,
              borderRadius: "9999px",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            Surface
          </span>
        </div>
      </div>
    </div>
  );
}