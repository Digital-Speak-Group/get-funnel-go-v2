import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RegeneratePanel } from "@/components/app/editor/RegeneratePanel";

describe("RegeneratePanel", () => {
  it("sends the trimmed instructions", () => {
    const onRegenerate = vi.fn();
    render(<RegeneratePanel onRegenerate={onRegenerate} isRegenerating={false} />);

    fireEvent.change(screen.getByLabelText(/Instructions pour l'IA/), {
      target: { value: "  utilise 94 % de satisfaction  " },
    });
    fireEvent.click(screen.getByRole("button", { name: /Regénérer/ }));

    expect(onRegenerate).toHaveBeenCalledWith("utilise 94 % de satisfaction");
  });

  it("allows regenerating without instructions", () => {
    const onRegenerate = vi.fn();
    render(<RegeneratePanel onRegenerate={onRegenerate} isRegenerating={false} />);

    fireEvent.click(screen.getByRole("button", { name: /Regénérer/ }));

    expect(onRegenerate).toHaveBeenCalledWith("");
  });

  it("disables input while regenerating", () => {
    render(<RegeneratePanel onRegenerate={vi.fn()} isRegenerating />);

    expect(screen.getByRole("button", { name: /Regénération/ })).toBeDisabled();
    expect(screen.getByLabelText(/Instructions pour l'IA/)).toBeDisabled();
  });

  it("shows the error as an alert", () => {
    render(<RegeneratePanel onRegenerate={vi.fn()} isRegenerating={false} error="La régénération a échoué." />);

    expect(screen.getByRole("alert")).toHaveTextContent("La régénération a échoué.");
  });
});
