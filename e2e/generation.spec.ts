import { test, expect, type Page } from "@playwright/test";
import { createDeckViaDashboard, login, openDeckEditor } from "./helpers";

const SCRIPT = "Bonjour à tous. ".repeat(30); // > 300 characters

/** Replays the generation event stream the API sends, without calling the AI. */
async function mockGeneration(page: Page, events: object[]) {
  await page.route("**/api/ai/generate", (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join(""),
    })
  );
}

async function fillWizard(page: Page) {
  await page.goto("/app/new");
  await expect(page.getByRole("heading", { name: "Nouveau deck IA" })).toBeVisible();

  // Step 1: the script, with its live counter and minimum.
  const next = page.getByTestId("wizard-next");
  await expect(next).toBeDisabled();
  await page.getByPlaceholder(/Collez votre script de vente/).fill(SCRIPT);
  await expect(page.getByTestId("wizard-script-count")).toContainText(String(SCRIPT.length));
  await next.click();

  // Step 2: template and theme cards.
  await expect(page.getByTestId("wizard-template").first()).toBeVisible();
  await next.click();

  // Step 3: settings, with the cost shown before generating.
  await expect(page.getByTestId("wizard-cost")).toContainText("1 deck de votre forfait");
}

test.describe("AI Generation Wizard", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("walks the three steps and follows the generation to the new deck", async ({ page }) => {
    // A real deck to land on, standing in for the generated one.
    const title = `Deck généré ${Date.now()}`;
    await createDeckViaDashboard(page, title);
    await openDeckEditor(page, title);
    const deckId = page.url().split("/").pop()!;

    await mockGeneration(page, [
      { status: "RESERVING_CREDITS" },
      { status: "EXTRACTING_BRIEF" },
      { status: "PLANNING_DECK" },
      { status: "GENERATING_SLIDES", progress: 0 },
      { status: "GENERATING_SLIDES", progress: 5, total: 5 },
      { status: "SAVING_DECK" },
      { status: "DONE", deckId },
    ]);
    await fillWizard(page);
    await page.getByRole("button", { name: /Générer le deck/ }).click();

    await expect(page).toHaveURL(new RegExp(`/app/decks/${deckId}$`), { timeout: 15000 });
  });

  test("a used-up plan opens the upgrade dialog instead of a generic error", async ({ page }) => {
    await mockGeneration(page, [{ status: "RESERVING_CREDITS" }, { status: "ERROR", error: "Insufficient AI credits" }]);
    await fillWizard(page);
    await page.getByRole("button", { name: /Générer le deck/ }).click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByTestId("wizard-progress")).toContainText("Vous avez utilisé tous les decks");
  });

  test.skip("generates a real deck from a script (calls the AI)", async ({ page }) => {
    // Skipped by default so CI never spends AI credits; run it by hand against a real key.
    await fillWizard(page);
    await page.getByRole("button", { name: /Générer le deck/ }).click();
    await expect(page).toHaveURL(/\/app\/decks\/[0-9a-f-]{36}$/, { timeout: 180000 });
  });
});
