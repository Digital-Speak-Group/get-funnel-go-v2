import * as React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SlideRenderer } from "@/components/slides/SlideRenderer";
import { StaticSlideProvider } from "@/components/slides/render-context";
import { SlideEditProvider } from "@/components/slides/editable";
import { makeElement, makeVideoElement } from "@/components/app/editor/free/free-ops";
import { addTableColumn, addTableRow, removeTableColumn, removeTableRow } from "@/components/app/editor/free/table-ops";
import { FreeElementSchema, type FreeTable } from "@/lib/slides/free";
import { SlideSchema, type Slide } from "@/lib/slides/schema";
import { defaultTheme } from "@/lib/slides/theme";
import { parseVideoUrl, videoEmbedUrl } from "@/lib/slides/video";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const slideOf = (elements: unknown[]) => ({ id: id(999), position: 0, type: "free", content: { elements } }) as unknown as Slide;

describe("tables (Task 78)", () => {
  const table = makeElement("table") as FreeTable;

  it("starts as a valid 3×3 table with a header", () => {
    expect(FreeElementSchema.safeParse(table).success).toBe(true);
    expect(table.rows).toHaveLength(3);
    expect(table.header).toBe(true);
  });

  it("adds and removes rows and columns within the limits", () => {
    expect(addTableRow(table)!.rows).toHaveLength(4);
    expect(addTableColumn(table)!.rows.every((r) => r.length === 4)).toBe(true);
    expect(removeTableColumn(table)!.rows[0]).toHaveLength(2);
    let t: FreeTable | null = table;
    while (t && t.rows.length > 1) t = removeTableRow(t);
    expect(t!.rows).toHaveLength(1);
    expect(removeTableRow(t!)).toBeNull();
  });

  it("rejects ragged rows", () => {
    expect(FreeElementSchema.safeParse({ ...table, rows: [["a", "b"], ["c"]] }).success).toBe(false);
  });

  it("renders cells, editable on the canvas by path", () => {
    const slide = slideOf([{ ...table, id: id(1), rows: [["Offre", "Prix"], ["Pro", "99 €"]] }]);
    const { container } = render(
      <SlideEditProvider onEdit={() => {}} placeholderFor={(p) => p}>
        <SlideRenderer slide={slide} theme={defaultTheme} />
      </SlideEditProvider>
    );
    expect(container.querySelector('[data-edit-path="elements.0.rows.1.1"]')).toHaveTextContent("99 €");
  });
});

describe("charts (Task 78)", () => {
  it("draws each chart type with labels and values", () => {
    for (const chart of ["bar", "hbar", "line", "pie", "donut"] as const) {
      const element = { ...makeElement("chart"), id: id(2), chart, unit: "k€" };
      expect(FreeElementSchema.safeParse(element).success).toBe(true);
      const { container, unmount } = render(<SlideRenderer slide={slideOf([element])} theme={defaultTheme} />);
      const svg = container.querySelector(`[data-free-id="${id(2)}"] svg`)!;
      expect(svg.getAttribute("aria-label")).toContain("T1 : 42 k€");
      expect(svg.textContent).toContain("T4");
      unmount();
    }
  });

  it("handles negative values and a single 100 % slice", () => {
    const neg = { ...makeElement("chart"), id: id(3), data: [{ label: "A", value: -5 }, { label: "B", value: 10 }] };
    expect(() => render(<SlideRenderer slide={slideOf([neg])} theme={defaultTheme} />)).not.toThrow();
    const pie = { ...makeElement("chart"), id: id(4), chart: "pie", data: [{ label: "Tout", value: 3 }] };
    const { container } = render(<SlideRenderer slide={slideOf([pie])} theme={defaultTheme} />);
    expect(container.querySelector(`[data-free-id="${id(4)}"] circle`)).not.toBeNull();
  });
});

describe("videos (Task 78)", () => {
  it("accepts YouTube and Vimeo links only", () => {
    expect(parseVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10")).toEqual({ provider: "youtube", videoId: "dQw4w9WgXcQ" });
    expect(parseVideoUrl("https://youtu.be/dQw4w9WgXcQ")).toEqual({ provider: "youtube", videoId: "dQw4w9WgXcQ" });
    expect(parseVideoUrl("https://www.youtube.com/shorts/abcDEF12345")).toEqual({ provider: "youtube", videoId: "abcDEF12345" });
    expect(parseVideoUrl("https://vimeo.com/123456789")).toEqual({ provider: "vimeo", videoId: "123456789" });
    expect(parseVideoUrl("https://evil.example/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(parseVideoUrl("javascript:alert(1)")).toBeNull();
    expect(videoEmbedUrl("youtube", "dQw4w9WgXcQ")).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0");
  });

  it("stores no URL, and shows a still frame in thumbnails, the player live", () => {
    const video = { ...makeVideoElement({ provider: "youtube", videoId: "dQw4w9WgXcQ" }), id: id(5) };
    expect(SlideSchema.safeParse(slideOf([video])).success).toBe(true);
    expect(FreeElementSchema.safeParse({ ...video, videoId: "../../x" }).success).toBe(false);

    const still = render(
      <StaticSlideProvider>
        <SlideRenderer slide={slideOf([video])} theme={defaultTheme} />
      </StaticSlideProvider>
    );
    expect(still.container.querySelector("iframe")).toBeNull();
    expect(still.container.querySelector("img")?.getAttribute("src")).toContain("i.ytimg.com");
    still.unmount();

    render(<SlideRenderer slide={slideOf([video])} theme={defaultTheme} />);
    expect(screen.getByTitle("Vidéo")).toHaveAttribute("src", videoEmbedUrl("youtube", "dQw4w9WgXcQ"));
  });
});
