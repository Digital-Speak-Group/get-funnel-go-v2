import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("dashboard", () => {
  test.beforeEach(async ({ page }) => {
    page.on("dialog", (dialog) => dialog.accept());
    await login(page);
  });

  test("create, list, rename, search and delete a deck without full reload", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Tableau de bord", exact: true })).toBeVisible();

    const deckTitle = `Deck e2e ${Date.now()}`;
    const cardWithTitle = (title: string) =>
      page.locator(`[data-testid="deck-card"][data-deck-title="${title}"]`);

    // Create
    await page.getByTestId("create-deck-open").click();
    await page.getByLabel("Titre", { exact: true }).fill(deckTitle);
    await page.getByRole("button", { name: "Créer le deck" }).click();
    const card = cardWithTitle(deckTitle);
    await expect(card).toBeVisible({ timeout: 10000 });

    // Rename (client-side only — no full page reload)
    await card.getByRole("button", { name: "Plus d'options" }).click();
    await page.getByRole("menuitem", { name: "Renommer" }).click();
    const renamedTitle = `${deckTitle} — renommé`;
    await card.getByLabel("Nouveau titre du deck").fill(renamedTitle);
    await card.getByRole("button", { name: "OK" }).click();
    const renamedCard = cardWithTitle(renamedTitle);
    await expect(renamedCard).toBeVisible({ timeout: 10000 });

    // Search filters the grid
    await page.getByLabel("Rechercher un deck").fill(renamedTitle);
    await expect(page.getByTestId("deck-card")).toHaveCount(1, { timeout: 10000 });

    // Clear search restores the list
    await page.getByLabel("Rechercher un deck").fill("");
    await expect(renamedCard).toBeVisible({ timeout: 10000 });

    // Delete
    await renamedCard.getByRole("button", { name: "Plus d'options" }).click();
    await page.getByRole("menuitem", { name: "Supprimer" }).click();
    await expect(cardWithTitle(renamedTitle)).toHaveCount(0, { timeout: 10000 });
  });

  test("sort select changes deck ordering", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Tableau de bord", exact: true })).toBeVisible();

    await page.getByLabel("Trier les decks").selectOption("title_asc");
    await expect(page).toHaveURL(/sort=title_asc/);

    const cards = page.getByTestId("deck-card");
    const count = await cards.count();
    if (count >= 2) {
      const first = await cards.nth(0).getAttribute("data-deck-title");
      const second = await cards.nth(1).getAttribute("data-deck-title");
      expect(first!.localeCompare(second!)).toBeLessThanOrEqual(0);
    }
  });
});
