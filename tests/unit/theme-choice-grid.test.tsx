import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeChoiceGrid } from "@/components/app/dashboard/ThemeChoiceGrid";
import { systemThemes } from "@/lib/slides/theme";

const themes = systemThemes.slice(0, 3).map((tokens, i) => ({ id: `theme-${i}`, name: tokens.name, tokens }));

function renderGrid(props: Partial<React.ComponentProps<typeof ThemeChoiceGrid>> = {}) {
  return render(
    <>
      <span id="label">Thème</span>
      <ThemeChoiceGrid themes={themes} value="theme-0" onChange={() => {}} deckTitle="" labelledBy="label" {...props} />
    </>
  );
}

describe("ThemeChoiceGrid", () => {
  it("is a labelled radio group with one option per theme, the current one checked", () => {
    renderGrid();
    expect(screen.getByRole("radiogroup", { name: "Thème" })).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(3);
    expect(screen.getByRole("radio", { name: themes[0].name })).toBeChecked();
    expect(screen.getByRole("radio", { name: themes[1].name })).not.toBeChecked();
  });

  it("reports the chosen theme", () => {
    const onChange = vi.fn();
    renderGrid({ onChange });
    fireEvent.click(screen.getByRole("radio", { name: themes[2].name }));
    expect(onChange).toHaveBeenCalledWith("theme-2");
  });

  it("previews the deck's own title, or a sample one while it is empty", () => {
    const { rerender } = renderGrid();
    expect(screen.getAllByText("Votre prochain deck de vente")).toHaveLength(3);

    rerender(
      <ThemeChoiceGrid themes={themes} value="theme-0" onChange={() => {}} deckTitle="Pitch Janvier" labelledBy="label" />
    );
    expect(screen.getAllByText("Pitch Janvier")).toHaveLength(3);
  });
});
