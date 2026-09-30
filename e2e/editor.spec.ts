import { test, expect } from "@playwright/test";
import { createDeckViaDashboard, login, openDeckEditor } from "./helpers";

test.describe("editor", () => {
  test.beforeEach(async ({ page }) => {
    page.on("dialog", (dialog) => dialog.accept());
    await login(page);
  });

  test("add slide, autosave persists across reload, reorder persists", async ({ page }) => {
    const deckTitle = `Deck éditeur ${Date.now()}`;
    await createDeckViaDashboard(page, deckTitle);
    await openDeckEditor(page, deckTitle);

    // Empty deck state
    await expect(page.getByTestId("editor-empty")).toBeVisible();
    await expect(page.getByTestId("editor-status")).toHaveText("À jour");

    // Add a cover slide
    await page.getByTestId("add-slide-submit").click();
    await expect(page.getByTestId("slide-item")).toHaveCount(1);
    await expect(page.getByTestId("slide-field-title")).toBeVisible();

    // Edit → debounced autosave → status shows saved
    await page.getByTestId("slide-field-title").fill("Titre e2e éditeur");
    await expect(page.getByTestId("editor-status")).toHaveText("Enregistré", {
      timeout: 8000,
    });

    // Add a second slide (problème)
    await page.getByTestId("add-slide-type").selectOption("problem");
    await page.getByTestId("add-slide-submit").click();
    await expect(page.getByTestId("slide-item")).toHaveCount(2);
    await expect(page.getByTestId("slide-item").nth(1)).toHaveAttribute(
      "data-slide-type",
      "problem"
    );

    // Reorder: move the second slide up (transactional server-side)
    await page
      .getByTestId("slide-item")
      .nth(1)
      .getByLabel("Monter le slide 2")
      .click();
    await expect(page.getByTestId("slide-item").first()).toHaveAttribute(
      "data-slide-type",
      "problem"
    );

    // Reload: both order and content persisted
    await page.reload();
    await expect(page.getByTestId("slide-item")).toHaveCount(2);
    await expect(page.getByTestId("slide-item").first()).toHaveAttribute(
      "data-slide-type",
      "problem"
    );
    // Re-selecting can race with hydration right after a reload — retry the
    // click together with the assertion so a dead pre-hydration click retries.
    await expect(async () => {
      await page.getByTestId("slide-item").nth(1).click();
      await expect(page.getByTestId("slide-field-title")).toHaveValue(
        "Titre e2e éditeur"
      );
    }).toPass({ timeout: 15000 });
  });

  test("validation errors appear inline and block save", async ({ page }) => {
    const deckTitle = `Deck éditeur invalide ${Date.now()}`;
    await createDeckViaDashboard(page, deckTitle);
    await openDeckEditor(page, deckTitle);

    await page.getByTestId("add-slide-submit").click();
    await expect(page.getByTestId("slide-field-title")).toBeVisible();

    // A valid edit saves
    await page.getByTestId("slide-field-title").fill("Valeur valide");
    await expect(page.getByTestId("editor-status")).toHaveText("Enregistré", {
      timeout: 8000,
    });

    // Over the 120-char schema limit → inline error, save blocked
    await page.getByTestId("slide-field-title").fill("x".repeat(121));
    await expect(page.getByTestId("slide-error-title")).toHaveText(
      "Maximum 120 caractères."
    );
    await expect(page.getByTestId("editor-status")).toHaveText(
      "Corrigez les erreurs avant d'enregistrement"
    );

    // Wait past the autosave window — the invalid value must not persist
    await page.waitForTimeout(1500);
    await page.reload();
    await expect(page.getByTestId("slide-field-title")).toHaveValue(
      "Valeur valide"
    );
  });
});
