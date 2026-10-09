// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { productTokens, type ProductToken } from "@/lib/design/tokens";

const css = readFileSync(path.resolve(__dirname, "../../src/styles/globals.css"), "utf8");

function rootHexTokens(source: string): Record<string, string> {
  const root = source.match(/:root\s*\{([\s\S]*?)\n\}/);
  if (!root) throw new Error(":root block not found in globals.css");
  const entries = [...root[1].matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\s*;/gi)];
  return Object.fromEntries(entries.map(([, name, value]) => [name, value.toLowerCase()]));
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const t = (name: ProductToken) => productTokens[name];

describe("product tokens", () => {
  it("TS token module matches the :root values in globals.css", () => {
    expect(rootHexTokens(css)).toEqual(productTokens);
  });

  describe.each(["bg", "surface", "surface-2"] as const)("text on %s", (surface) => {
    it.each(["fg", "fg-muted", "fg-faint", "brand", "danger", "success", "warning"] as const)(
      "%s reaches 4.5:1",
      (text) => {
        expect(contrast(t(text), t(surface))).toBeGreaterThanOrEqual(4.5);
      },
    );
  });

  it.each([
    ["primary-fg", "primary"],
    ["primary-fg", "primary-hover"],
    ["destructive-fg", "destructive"],
  ] as const)("%s on %s reaches 4.5:1", (fg, bg) => {
    expect(contrast(t(fg), t(bg))).toBeGreaterThanOrEqual(4.5);
  });

  it("focus ring reaches 3:1 against the page background", () => {
    expect(contrast(t("ring"), t("bg"))).toBeGreaterThanOrEqual(3);
  });

  it("faint text stays visibly dimmer than muted text", () => {
    expect(luminance(t("fg-faint"))).toBeLessThan(luminance(t("fg-muted")));
  });
});
