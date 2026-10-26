import { test, expect } from "@playwright/test";
import { createDeckViaDashboard, login, openDeckEditor } from "./helpers";

/**
 * Screenshot baselines for the key screens (Task 51). Font rendering differs by OS, so the
 * baselines are recorded on Windows (`*-chromium-win32.png`) and the suite skips elsewhere;
 * record Linux ones with `npx playwright test visual --update-snapshots` on that OS.
 * Data that changes between runs (deck titles, deck lists, timers) is masked.
 */
test.skip(process.platform !== "win32", "Baselines are recorded on Windows");
test.use({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });

const SHOT = { maxDiffPixelRatio: 0.02, animations: "disabled" as const };

test.describe("visual baselines", () => {
  test("login and landing", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveScreenshot("login.png", SHOT);

    await page.goto("/", { waitUntil: "load" });
    await page.waitForTimeout(2000); // hero preview starts when the browser is idle
    await expect(page).toHaveScreenshot("landing.png", SHOT);
  });

  test("dashboard, editor, presenter, audience", async ({ page, context }) => {
    test.setTimeout(120000);
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await login(page);

    await page.goto("/app");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("dashboard.png", {
      ...SHOT,
      mask: [page.locator('[data-testid="deck-card"]'), page.getByText(/decks?$/)],
    });

    const title = `Deck visuel ${Date.now()}`;
    await createDeckViaDashboard(page, title);
    await openDeckEditor(page, title);
    await page.getByTestId("add-slide-type").selectOption("problem");
    await page.getByTestId("add-slide-submit").click();
    await expect(page.getByTestId("editor-status")).toHaveText(/À jour|Enregistré/, { timeout: 8000 });
    await page.mouse.move(0, 0);
    await expect(page).toHaveScreenshot("editor.png", { ...SHOT, mask: [page.getByTestId("editor-title"), page.getByTestId("editor-status")] });

    await page.getByRole("button", { name: /Lien audience/ }).click();
    const audienceUrl = await page.evaluate(() => navigator.clipboard.readText());
    await page.goto(page.url().replace("/app/decks/", "/present/"));
    await expect(page.getByRole("button", { name: /Démarrer/ })).toBeVisible();
    await expect(page).toHaveScreenshot("presenter.png", {
      ...SHOT,
      mask: [page.getByRole("heading", { level: 1 }), page.getByTestId("presenter-link-status")],
    });

    await page.goto(audienceUrl);
    await expect(page.locator("[data-slide-index]")).toBeVisible();
    await expect(page).toHaveScreenshot("audience.png", SHOT);
  });
});
