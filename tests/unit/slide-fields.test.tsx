import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SlideFields } from "@/components/app/editor/SlideFields";
import { buildDefaultContent } from "@/lib/slides/defaults";
import type { EditorSlide } from "@/components/app/editor/validation";
import { randomUUID } from "node:crypto";

function makeSlide(overrides?: Partial<EditorSlide>): EditorSlide {
  return {
    id: randomUUID(),
    position: 0,
    type: "cover",
    content: buildDefaultContent("cover"),
    notes: "",
    script: "",
    ...overrides,
  };
}

describe("SlideFields", () => {
  it("renders cover fields with French labels and stable testids", () => {
    render(<SlideFields slide={makeSlide()} errors={{}} onChange={vi.fn()} />);
    expect(screen.getByTestId("slide-field-title")).toBeInTheDocument();
    expect(screen.getByTestId("slide-field-notes")).toBeInTheDocument();
    expect(screen.getByTestId("slide-field-script")).toBeInTheDocument();
    expect(screen.getByLabelText(/^Titre/)).toBeInTheDocument();
  });

  it("emits a content patch when a field is edited", () => {
    const onChange = vi.fn();
    render(<SlideFields slide={makeSlide()} errors={{}} onChange={onChange} />);
    fireEvent.change(screen.getByTestId("slide-field-title"), {
      target: { value: "Bonjour" },
    });
    expect(onChange).toHaveBeenCalledWith({
      content: expect.objectContaining({ title: "Bonjour" }),
    });
  });

  it("shows an inline error for a failing field", () => {
    render(
      <SlideFields
        slide={makeSlide()}
        errors={{ title: ["Maximum 120 caractères."] }}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByTestId("slide-error-title")).toHaveTextContent(
      "Maximum 120 caractères."
    );
  });

  it("renders array controls for list-based content", () => {
    const slide = makeSlide({
      type: "problem",
      content: buildDefaultContent("problem"),
    });
    render(<SlideFields slide={slide} errors={{}} onChange={vi.fn()} />);
    expect(screen.getByTestId("slide-add-painPoints")).toBeInTheDocument();
    expect(
      screen.getByTestId("slide-remove-painPoints.0")
    ).toBeInTheDocument();
    expect(screen.getByTestId("slide-field-painPoints.0.title")).toHaveValue(
      "Nouveau titre"
    );
  });

  it("renders an enum field as a select", () => {
    const slide = makeSlide({
      type: "channel",
      content: buildDefaultContent("channel"),
    });
    render(<SlideFields slide={slide} errors={{}} onChange={vi.fn()} />);
    expect(screen.getByTestId("slide-field-channel")).toHaveValue("whatsapp");
  });
});
