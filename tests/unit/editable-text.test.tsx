import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EditableText, SlideEditProvider } from "@/components/slides/editable";
import { SlideRenderer } from "@/components/slides/SlideRenderer";
import { defaultTheme } from "@/lib/slides/theme";
import type { Slide } from "@/lib/slides/schema";

const placeholderFor = (path: string) => `Champ ${path}`;

function editing(ui: React.ReactNode, onEdit = vi.fn()) {
  return { onEdit, ...render(<SlideEditProvider onEdit={onEdit} placeholderFor={placeholderFor}>{ui}</SlideEditProvider>) };
}

const problem: Slide = {
  id: "00000000-0000-4000-8000-0000000000a1",
  position: 0,
  type: "problem",
  content: {
    headline: "Trois fuites",
    painPoints: [
      { title: "Trafic", text: "97 % repartent" },
      { title: "Budget", text: "Sans système" },
    ],
  },
};

describe("EditableText outside the editor", () => {
  it("renders the plain element and text, not editable", () => {
    const { container } = render(<EditableText as="h1" path="headline" value="Titre" style={{ fontSize: "48px" }} />);
    expect(container.innerHTML).toBe('<h1 style="font-size: 48px;">Titre</h1>');
  });

  it("renders nothing for empty optional text", () => {
    const { container } = render(<EditableText as="p" path="intro" value={undefined} />);
    expect(container.innerHTML).toBe("");
  });

  it("leaves rendered slides free of editing attributes", () => {
    const { container } = render(<SlideRenderer slide={problem} theme={defaultTheme} />);
    expect(container.querySelector("[contenteditable]")).toBeNull();
    expect(screen.getByRole("img")).toBeInTheDocument();
  });
});

describe("EditableText in the editor", () => {
  it("is a labelled editable field that reports its path and new text", () => {
    const { onEdit } = editing(<EditableText as="h1" path="headline" value="Titre" />);
    const field = screen.getByLabelText("Champ headline");
    expect(field).toHaveAttribute("contenteditable", "plaintext-only");
    expect(field).toHaveTextContent("Titre");

    field.textContent = "Nouveau titre";
    fireEvent.input(field);
    expect(onEdit).toHaveBeenCalledWith("headline", "Nouveau titre");
  });

  it("ends a single-line field on Enter but keeps Enter in multi-line ones", () => {
    editing(
      <>
        <EditableText path="title" value="A" />
        <EditableText path="text" value="B" multiline />
      </>
    );
    const single = screen.getByLabelText("Champ title");
    const multi = screen.getByLabelText("Champ text");
    expect(fireEvent.keyDown(single, { key: "Enter" })).toBe(false); // default prevented
    expect(fireEvent.keyDown(multi, { key: "Enter" })).toBe(true);
    expect(multi).toHaveAttribute("role", "textbox");
    expect(multi).toHaveAttribute("aria-multiline", "true");
  });

  it("shows empty optional text as a placeholder field so it can be filled in", () => {
    editing(<EditableText as="p" path="intro" value={undefined} />);
    const field = screen.getByLabelText("Champ intro");
    expect(field).toBeEmptyDOMElement();
    expect(field).toHaveAttribute("data-placeholder", "Champ intro");
  });

  it("makes a whole slide editable, item paths included", () => {
    const { onEdit } = editing(<SlideRenderer slide={problem} theme={defaultTheme} />);
    expect(screen.getByRole("group")).toBeInTheDocument();

    const second = screen.getByText("Budget");
    expect(second).toHaveAttribute("data-edit-path", "painPoints.1.title");
    second.textContent = "Budget pub";
    fireEvent.input(second);
    expect(onEdit).toHaveBeenCalledWith("painPoints.1.title", "Budget pub");
  });
});

describe("EditableText accessibility in the editor", () => {
  it("keeps headings as labelled headings and makes other text labelled textboxes", () => {
    editing(
      <>
        <EditableText as="h1" path="headline" value="Titre" />
        <EditableText as="p" path="intro" value="Intro" />
      </>
    );
    expect(screen.getByRole("heading", { name: "Champ headline" })).not.toHaveAttribute("role");
    expect(screen.getByRole("textbox", { name: "Champ intro" })).toHaveTextContent("Intro");
  });
});
