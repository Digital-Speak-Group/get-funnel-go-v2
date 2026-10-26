import { test, expect, type Page } from "@playwright/test";
import { createDeckViaDashboard, login, openDeckEditor } from "./helpers";

// Task 43: desktop sidebar collapse (reflow + persisted via cookie) and the ⌘K / Ctrl+K palette.

const palette = (page: Page) => page.getByRole("dialog", { name: "Palette de commandes" });

async function mainLeft(page: Page): Promise<number> {
  const box = await page.getByRole("main").boundingBox();
  if (!box) throw new Error("main landmark not rendered");
  return box.x;
}

test.describe("app shell", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("collapsing the sidebar reflows content and persists across reloads", async ({ page }) => {
    await page.goto("/app");
    const collapse = page.getByRole("button", { name: "Réduire la barre latérale" });
    const expand = page.getByRole("button", { name: "Étendre la barre latérale" });

    await expect(collapse).toBeVisible();
    const expandedLeft = await mainLeft(page);

    await collapse.click();
    await expect(expand).toBeVisible();
    await expect.poll(() => mainLeft(page)).toBe(56);
    const collapsedLeft = await mainLeft(page);

    // Server reads the cookie: first paint already has the collapsed width.
    await page.reload();
    await expect(expand).toBeVisible();
    await expect.poll(() => mainLeft(page)).toBe(collapsedLeft);

    // Persists on another /app page too, then restore the default for other specs.
    await page.goto("/app/templates");
    await expect(expand).toBeVisible();
    await expand.click();
    await expect(collapse).toBeVisible();
    await page.reload();
    await expect(collapse).toBeVisible();
    await expect.poll(() => mainLeft(page)).toBe(expandedLeft);
  });

  test("Ctrl+K opens the palette on every /app page, Esc closes it", async ({ page }) => {
    const deckTitle = `Deck palette ${Date.now()}`;
    await createDeckViaDashboard(page, deckTitle);
    await openDeckEditor(page, deckTitle);
    const editorUrl = page.url();

    for (const url of ["/app", "/app/new", "/app/templates", "/app/settings/billing", editorUrl]) {
      await page.goto(url);
      await page.getByRole("main").waitFor();
      await page.keyboard.press("Control+k");
      await expect(palette(page), `palette on ${url}`).toBeVisible();
      await expect(page.getByPlaceholder("Rechercher un deck, une page, une action…")).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(palette(page), `palette closed on ${url}`).toBeHidden();
    }
  });

  test("palette is fully keyboard-operable: filter, jump to a deck, run an action", async ({ page }) => {
    const deckTitle = `Deck clavier ${Date.now()}`;
    await createDeckViaDashboard(page, deckTitle);

    // Jump to a deck by title.
    await page.keyboard.press("Control+k");
    await expect(palette(page)).toBeVisible();
    await page.keyboard.type(deckTitle);
    await expect(palette(page).getByRole("option", { name: deckTitle })).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/app\/decks\/[0-9a-f-]{36}$/, { timeout: 30000 });
    await expect(palette(page)).toBeHidden();

    // Run an action with arrows + Enter.
    await page.keyboard.press("Control+k");
    await page.keyboard.type("Parcourir les modèles");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/app\/templates$/);

    // Ctrl+K toggles: a second press closes it.
    await page.keyboard.press("Control+k");
    await expect(palette(page)).toBeVisible();
    await page.keyboard.press("Control+k");
    await expect(palette(page)).toBeHidden();
  });

  test("topbar search button opens the palette", async ({ page }) => {
    await page.goto("/app");
    await page.getByRole("button", { name: "Palette de commandes (Ctrl+K)" }).click();
    await expect(palette(page)).toBeVisible();
  });
});
