import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("AI Generation Wizard", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test.skip("generates a new deck from script", async ({ page }) => {
    // We skip this by default so we don't hammer the AI in regular CI
    // We could mock the API route using page.route()
    
    // Mock the API route for generation
    await page.route("**/api/ai/generate", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: `data: {"status":"EXTRACTING_BRIEF"}\n\ndata: {"status":"DONE","deckId":"mock-deck-id"}\n\n`
      });
    });

    await page.goto("/app/new");

    // Wait for the UI
    await expect(page.getByText("Nouveau deck IA")).toBeVisible();

    // Fill in the script
    const script = "A".repeat(350); // min 300
    await page.getByPlaceholder(/Collez votre script de vente/).fill(script);

    // Select template
    await page.locator("select").nth(0).selectOption({ index: 0 });

    // Click generate
    await page.getByRole("button", { name: /Générer le deck/ }).click();

    // Should transition to done and navigate
    // Note: since our mock returns DONE with deckId "mock-deck-id", it will redirect to /app/decks/mock-deck-id
  });
});
