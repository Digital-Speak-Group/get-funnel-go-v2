import * as React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { convertRenderedSlide, nearestRole, parseCssColor, styleFor } from "@/components/app/editor/free/convert";
import { SlideRenderer } from "@/components/slides/SlideRenderer";
import { SlideEditProvider } from "@/components/slides/editable";
import { FreeElementSchema } from "@/lib/slides/free";
import { defaultTheme } from "@/lib/slides/theme";
import type { Slide } from "@/lib/slides/schema";

describe("conversion helpers", () => {
  it("parses rgb and rgba colours", () => {
    expect(parseCssColor("rgb(10, 20, 30)")).toEqual({ rgb: [10, 20, 30], alpha: 1 });
    expect(parseCssColor("rgba(10, 20, 30, 0.5)")).toEqual({ rgb: [10, 20, 30], alpha: 0.5 });
    expect(parseCssColor("rgb(10 20 30 / 40%)")).toEqual({ rgb: [10, 20, 30], alpha: 0.4 });
    expect(parseCssColor("transparent")).toBeNull();
  });

  it("maps a colour to the closest theme role", () => {
    const hex = defaultTheme.color.primary;
    const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
    expect(nearestRole(rgb, defaultTheme)).toBe("primary");
    expect(nearestRole(rgb, defaultTheme, ["text", "muted"])).not.toBe("primary");
  });

  it("picks the text style from the font family, then the size", () => {
    expect(styleFor(72, true)).toBe("title");
    expect(styleFor(22, true)).toBe("subtitle");
    expect(styleFor(22, false)).toBe("body");
    expect(styleFor(15, false)).toBe("caption");
  });
});

describe("convertRenderedSlide", () => {
  it("turns every displayed text of a structured slide into valid freeform text", () => {
    const slide: Slide = {
      id: "00000000-0000-4000-8000-0000000000c1",
      position: 0,
      type: "problem",
      content: {
        headline: "Trois fuites",
        painPoints: [
          { title: "Trafic", text: "97 % repartent" },
          { title: "Budget", text: "Sans système" },
          { title: "Temps", text: "Tout à la main" },
        ],
      },
    };
    const { container } = render(
      <SlideEditProvider onEdit={() => {}} placeholderFor={(p) => p}>
        <SlideRenderer slide={slide} theme={defaultTheme} />
      </SlideEditProvider>
    );
    const elements = convertRenderedSlide(container.querySelector<HTMLElement>('[role="group"]')!, slide.content, defaultTheme);

    const texts = elements.filter((e) => e.kind === "text").map((e) => (e.kind === "text" ? e.text : ""));
    expect(texts).toEqual(["Trois fuites", "Trafic", "97 % repartent", "Budget", "Sans système", "Temps", "Tout à la main"]);
    for (const element of elements) expect(FreeElementSchema.safeParse(element).success).toBe(true);
  });
});
