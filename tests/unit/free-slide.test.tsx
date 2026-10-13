import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SlideRenderer } from "@/components/slides/SlideRenderer";
import { SlideEditProvider } from "@/components/slides/editable";
import { AI_SLIDE_TYPES, SlideSchema, SLIDE_TYPES, type Slide } from "@/lib/slides/schema";
import { buildDefaultContent } from "@/lib/slides/defaults";
import { defaultTheme } from "@/lib/slides/theme";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

function freeSlide(elements: unknown[]): Slide {
  return { id: id(999), position: 0, type: "free", content: { elements } } as Slide;
}

describe("free slide schema", () => {
  it("accepts the starter content of a new freeform slide", () => {
    const slide = { id: id(1), position: 0, type: "free", content: buildDefaultContent("free") };
    expect(SlideSchema.safeParse(slide).success).toBe(true);
  });

  it("accepts every element kind with theme colours", () => {
    const parsed = SlideSchema.safeParse(
      freeSlide([
        { id: id(2), kind: "text", text: "Titre", style: "title", x: 96, y: 96, w: 800, h: 90, color: "primary", align: "center" },
        { id: id(3), kind: "shape", shape: "ellipse", x: 0, y: 0, w: 200, h: 200, fill: "accent", rotation: 15 },
        { id: id(4), kind: "image", x: 1000, y: 300, w: 600, h: 400, fit: "contain" },
        { id: id(5), kind: "icon", icon: "rocket", x: 10, y: 10, w: 64, h: 64 },
      ])
    );
    expect(parsed.success).toBe(true);
  });

  it("rejects hex colours, unknown kinds and more than 60 elements", () => {
    const text = (n: number, extra: object = {}) => ({ id: id(n), kind: "text", text: "T", style: "body", x: 0, y: 0, w: 100, h: 40, ...extra });
    expect(SlideSchema.safeParse(freeSlide([text(6, { color: "#ff0000" })])).success).toBe(false);
    expect(SlideSchema.safeParse(freeSlide([{ ...text(7), kind: "video" }])).success).toBe(false);
    expect(SlideSchema.safeParse(freeSlide(Array.from({ length: 61 }, (_, i) => text(100 + i)))).success).toBe(false);
  });

  it("is never offered to the AI", () => {
    expect(SLIDE_TYPES).toContain("free");
    expect(AI_SLIDE_TYPES).not.toContain("free");
    expect(AI_SLIDE_TYPES).toHaveLength(SLIDE_TYPES.length - 1);
  });
});

describe("free slide renderer", () => {
  const slide = freeSlide([
    { id: id(10), kind: "shape", shape: "rect", x: 100, y: 200, w: 300, h: 150, fill: "accent", rotation: 10 },
    { id: id(11), kind: "text", text: "Bonjour", style: "subtitle", x: 500, y: 600, w: 700, h: 60, color: "danger" },
  ]);

  it("places each element at its position, size and rotation, in order", () => {
    const { container } = render(<SlideRenderer slide={slide} theme={defaultTheme} />);
    const boxes = container.querySelectorAll<HTMLElement>("[data-free-id]");
    expect([...boxes].map((b) => b.dataset.freeId)).toEqual([id(10), id(11)]);
    expect(boxes[0]).toHaveStyle({ left: "100px", top: "200px", width: "300px", height: "150px", transform: "rotate(10deg)" });
    expect(boxes[0].firstElementChild).toHaveStyle({ background: "var(--slide-accent)" });
    expect(screen.getByText("Bonjour")).toHaveStyle({ color: "var(--slide-danger)", fontSize: "40px" });
  });

  it("makes texts editable on the canvas at their element path", () => {
    render(
      <SlideEditProvider onEdit={vi.fn()} placeholderFor={(p) => p}>
        <SlideRenderer slide={slide} theme={defaultTheme} />
      </SlideEditProvider>
    );
    expect(screen.getByText("Bonjour")).toHaveAttribute("data-edit-path", "elements.1.text");
  });
});
