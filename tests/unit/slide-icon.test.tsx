import * as React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { SlideIcon } from "@/components/slides/icons";
import { SLIDE_ICON_NAMES } from "@/lib/slides/icons";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("SlideIcon", () => {
  it("renders a known name as an svg, not as text", () => {
    const { container } = render(<SlideIcon name="award" size={24} />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.textContent).not.toContain("award");
  });

  it("renders every curated name", () => {
    for (const name of SLIDE_ICON_NAMES) {
      const { container, unmount } = render(<SlideIcon name={name} size={24} />);
      expect(container.querySelector("svg"), name).not.toBeNull();
      unmount();
    }
  });

  it("falls back for empty or unknown words instead of printing them", () => {
    expect(render(<SlideIcon size={24} fallback="✓" />).container.textContent).toBe("✓");
    expect(render(<SlideIcon name="not-an-icon" size={24} fallback="3" />).container.textContent).toBe("3");
  });

  it("keeps emoji-style free text", () => {
    expect(render(<SlideIcon name="🚀" size={24} fallback="✓" />).container.textContent).toBe("🚀");
  });

  it("covers every icon name used by the seeded templates", () => {
    const dir = resolve(process.cwd(), "scripts/seed/templates");
    const used = readdirSync(dir).flatMap((file) =>
      [...readFileSync(resolve(dir, file), "utf8").matchAll(/"icon":\s*"([^"]+)"/g)].map((m) => m[1])
    );
    const known: readonly string[] = SLIDE_ICON_NAMES;
    expect(used.filter((name) => !known.includes(name))).toEqual([]);
  });
});
