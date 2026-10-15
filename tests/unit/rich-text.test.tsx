import * as React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RichTextView } from "@/components/slides/RichTextView";
import { SlideRenderer } from "@/components/slides/SlideRenderer";
import { richToTiptap, tiptapToRich } from "@/components/app/editor/free/rich-convert";
import { RichTextSchema, isPlainRich, plainToRich, richToPlain, type RichText } from "@/lib/slides/rich-text";
import { SlideSchema, type Slide } from "@/lib/slides/schema";
import { defaultTheme } from "@/lib/slides/theme";

const rich: RichText = [
  { runs: [{ text: "Une " }, { text: "offre", bold: true }, { text: " claire", italic: true, underline: true }] },
  { list: "bullet", runs: [{ text: "Point A" }] },
  { list: "bullet", runs: [{ text: "Voir ", }, { text: "le site", link: "https://example.com" }] },
  { list: "ordered", runs: [{ text: "Étape 1" }] },
  { runs: [] },
  { runs: [{ text: "ligne 1\nligne 2" }] },
];

describe("rich text format (Task 76)", () => {
  it("validates, and rejects unsafe links", () => {
    expect(RichTextSchema.safeParse(rich).success).toBe(true);
    expect(RichTextSchema.safeParse([{ runs: [{ text: "x", link: "javascript:alert(1)" }] }]).success).toBe(false);
    expect(RichTextSchema.safeParse([{ runs: [{ text: "x", link: "mailto:a@b.fr" }] }]).success).toBe(true);
  });

  it("round-trips through TipTap's document format", () => {
    expect(tiptapToRich(richToTiptap(rich))).toEqual(rich);
    expect(tiptapToRich(richToTiptap(plainToRich("a\nb")))).toEqual(plainToRich("a\nb"));
  });

  it("drops what the format cannot hold: nested lists flatten, unsafe links go", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                { type: "paragraph", content: [{ type: "text", text: "a", marks: [{ type: "link", attrs: { href: "javascript:x" } }, { type: "strike" }] }] },
                { type: "orderedList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "b" }] }] }] },
              ],
            },
          ],
        },
      ],
    };
    expect(tiptapToRich(doc)).toEqual([
      { list: "bullet", runs: [{ text: "a" }] },
      { list: "ordered", runs: [{ text: "b" }] },
    ]);
  });

  it("keeps a plain mirror and knows when formatting adds nothing", () => {
    expect(richToPlain(rich)).toBe("Une offre claire\nPoint A\nVoir le site\nÉtape 1\n\nligne 1\nligne 2");
    expect(isPlainRich(plainToRich("a\nb"))).toBe(true);
    expect(isPlainRich(rich)).toBe(false);
  });

  it("renders paragraphs, lists, marks and safe links only", () => {
    const { container } = render(
      <RichTextView rich={[...rich, { runs: [{ text: "piège", link: "javascript:alert(1)" }] }]} />
    );
    expect(container.querySelectorAll("ul > li")).toHaveLength(2);
    expect(container.querySelectorAll("ol > li")).toHaveLength(1);
    expect(screen.getByText("offre")).toHaveStyle({ fontWeight: "800" });
    expect(screen.getByRole("link", { name: "le site" })).toHaveAttribute("href", "https://example.com");
    expect(screen.getByText("piège").tagName).toBe("SPAN");
  });

  it("shows on freeform slides outside the editor", () => {
    const slide = {
      id: "00000000-0000-4000-8000-000000000001",
      position: 0,
      type: "free",
      content: {
        elements: [
          { id: "00000000-0000-4000-8000-000000000002", kind: "text", style: "body", text: richToPlain(rich), rich, x: 0, y: 0, w: 900, h: 400, lineHeight: 1.6, letterSpacing: 0.05 },
        ],
      },
    } as unknown as Slide;
    expect(SlideSchema.safeParse(slide).success).toBe(true);
    render(<SlideRenderer slide={slide} theme={defaultTheme} />);
    expect(screen.getByRole("link", { name: "le site" })).toBeInTheDocument();
    expect(screen.getByText("Point A").closest("ul")).not.toBeNull();
  });
});
