import { describe, expect, it } from "vitest";
import { breadcrumbsFor } from "@/components/app/breadcrumbs";

const labels = (path: string) => breadcrumbsFor(path).map((c) => c.label);

describe("breadcrumbsFor", () => {
  it("shows Tableau de bord on the dashboard", () => {
    expect(labels("/app")).toEqual(["Tableau de bord"]);
  });

  it("does not nest top-level pages under Decks", () => {
    expect(labels("/app/new")).toEqual(["Nouveau deck"]);
    expect(labels("/app/templates")).toEqual(["Modèles"]);
  });

  it("nests the editor under the dashboard and links the parent to the list", () => {
    const crumbs = breadcrumbsFor("/app/decks/0b4c2f7e-1111-4c4c-9999-123456789abc");
    expect(crumbs.map((c) => c.label)).toEqual(["Tableau de bord", "Éditeur"]);
    expect(crumbs.every((c) => c.href === "/app")).toBe(true);
  });

  it("nests settings sub-pages under Paramètres", () => {
    expect(labels("/app/settings/billing")).toEqual(["Paramètres", "Facturation"]);
  });
});
