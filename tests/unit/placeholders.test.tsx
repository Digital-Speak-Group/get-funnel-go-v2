import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { randomUUID } from "node:crypto";
import { findPlaceholders } from "@/components/app/editor/placeholders";
import { PlaceholderBadge } from "@/components/app/editor/PlaceholderHints";
import { SlideFields } from "@/components/app/editor/SlideFields";
import { buildDefaultContent } from "@/lib/slides/defaults";
import { EMPTY_EDITOR_CUE } from "@/components/app/editor/cue";

describe("findPlaceholders", () => {
  it("collects unique bracketed placeholders from nested content", () => {
    const content = {
      headline: "Qui je suis — [Votre nom]",
      points: [
        { title: "Fondateur de [Votre entreprise]", text: "Depuis [X] ans" },
        { title: "[Votre nom]", text: "Sans placeholder" },
      ],
    };
    expect(findPlaceholders(content)).toEqual(["[Votre nom]", "[Votre entreprise]", "[X]"]);
  });

  it("returns nothing for clean content", () => {
    expect(findPlaceholders({ title: "Tunnel RDV", items: ["a", "b"] })).toEqual([]);
  });

  it("ignores empty brackets and multi-line spans", () => {
    expect(findPlaceholders({ a: "[] et [début\nfin]" })).toEqual([]);
  });
});

describe("placeholder hints", () => {
  it("badge shows a count label and hides at zero", () => {
    const { container, rerender } = render(<PlaceholderBadge count={3} />);
    expect(screen.getByTestId("slide-placeholder-badge")).toHaveAccessibleName("3 éléments à compléter");
    rerender(<PlaceholderBadge count={0} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("slide fields list the remaining placeholders", () => {
    const content = { ...buildDefaultContent("cover"), title: "Tunnel", presenterName: "[Votre nom]" };
    render(
      <SlideFields
        slide={{ id: randomUUID(), position: 0, type: "cover", content, notes: "", script: "", cue: EMPTY_EDITOR_CUE }}
        errors={{}}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByTestId("slide-placeholder-notice")).toHaveTextContent("[Votre nom]");
  });
});
