// @vitest-environment node
/**
 * Design guardrail: product chrome must use tokens from src/styles/globals.css,
 * never raw Tailwind palette classes, hex values, or rgb()/hsl() literals.
 * Slide components (src/components/slides) are exempt — they read deck theme variables.
 *
 * MIGRATING lists files not yet moved onto tokens (Phase 5). Remove a file from it as soon
 * as it is clean; the second test fails if a listed file no longer needs the exemption.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(__dirname, "../..");
const SCAN_DIRS = ["src/app", "src/components"];
const EXEMPT_DIRS = ["src/components/slides"];

const PALETTE =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const PREFIXES =
  "bg|text|border|border-[trblxy]|ring|ring-offset|from|via|to|fill|stroke|outline|divide|placeholder|shadow|decoration|caret|accent";

const RULES: { name: string; pattern: RegExp }[] = [
  { name: "palette class", pattern: new RegExp(`\\b(?:${PREFIXES})-(?:${PALETTE})-\\d{2,3}\\b`) },
  { name: "white/black class", pattern: new RegExp(`\\b(?:${PREFIXES})-(?:white|black)\\b`) },
  { name: "arbitrary color value", pattern: /-\[[^\]]*(?:#[0-9a-f]{3,8}|rgba?\(|hsla?\()/i },
  { name: "hex color", pattern: /(?<![\w&])#(?:[0-9a-f]{6}|[0-9a-f]{3})\b/i },
  { name: "rgb()/hsl() literal", pattern: /\b(?:rgba?|hsla?)\(/ },
];

const MIGRATING = new Set<string>([
  "src/app/(app)/app/settings/billing/BillingClient.tsx",
  "src/app/(app)/app/settings/layout.tsx",
  "src/app/(app)/app/settings/organization/page.tsx",
  "src/app/(app)/app/settings/profile/page.tsx",
  "src/app/(auth)/callback/CallbackContent.tsx",
  "src/app/(auth)/callback/page.tsx",
  "src/app/(auth)/layout.tsx",
  "src/app/(auth)/login/LoginContent.tsx",
  "src/app/(auth)/login/page.tsx",
  "src/app/(auth)/signup/SignupContent.tsx",
  "src/app/(auth)/signup/page.tsx",
  "src/app/(marketing)/layout.tsx",
  "src/app/(marketing)/page.tsx",
  "src/app/(marketing)/pricing/page.tsx",
  "src/app/global-error.tsx",
  "src/app/onboarding/OnboardingContent.tsx",
  "src/app/onboarding/layout.tsx",
  "src/app/onboarding/page.tsx",
  "src/app/opengraph-image.tsx",
  "src/components/app/ThemePicker.tsx",
  "src/components/app/billing/PlanCard.tsx",
  "src/components/app/billing/UpgradeDialog.tsx",
  "src/components/app/billing/UsageMeter.tsx",
  "src/components/app/editor/EditorShell.tsx",
  "src/components/app/editor/SlideCanvas.tsx",
  "src/components/app/editor/SlideFields.tsx",
  "src/components/app/editor/SlideList.tsx",
  "src/components/app/wizard/GenerationWizard.tsx",
  "src/components/presenter/AudienceView.tsx",
  "src/components/presenter/PresenterShell.tsx",
]);

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) return walk(full);
    return /\.(tsx?|jsx?)$/.test(entry) ? [full] : [];
  });
}

function violations(file: string): string[] {
  const lines = readFileSync(file, "utf8").split("\n");
  return lines.flatMap((line, i) =>
    RULES.filter((rule) => rule.pattern.test(line)).map((rule) => `L${i + 1} ${rule.name}: ${line.trim()}`),
  );
}

const files = SCAN_DIRS.flatMap((dir) => walk(path.join(ROOT, dir)))
  .map((file) => path.relative(ROOT, file).split(path.sep).join("/"))
  .filter((file) => !EXEMPT_DIRS.some((dir) => file.startsWith(`${dir}/`)));

describe("design guardrail", () => {
  it("product chrome uses tokens only", () => {
    const report = files
      .filter((file) => !MIGRATING.has(file))
      .flatMap((file) => violations(path.join(ROOT, file)).map((v) => `${file} ${v}`));
    expect(report).toEqual([]);
  });

  it("MIGRATING lists only files that still need the exemption", () => {
    const stale = [...MIGRATING].filter(
      (file) => !files.includes(file) || violations(path.join(ROOT, file)).length === 0,
    );
    expect(stale).toEqual([]);
  });
});
