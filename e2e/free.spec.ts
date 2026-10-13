import { test, expect, type Locator, type Page } from "@playwright/test";
import { createDeckViaDashboard, login, openDeckEditor } from "./helpers";

/** Drags `el` by (dx, dy) screen pixels, grabbing it near its left edge. */
async function drag(page: Page, el: Locator, dx: number, dy: number) {
  const box = (await el.boundingBox())!;
  const x = box.x + 30;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 8 });
  await page.mouse.up();
}

const left = (el: Locator) => el.evaluate((n: HTMLElement) => parseFloat(n.style.left));

test.describe("freeform slides", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);
  });

  test("move, add, undo and type on a freeform slide; it all persists", async ({ page }) => {
    const deckTitle = `Deck libre ${Date.now()}`;
    await createDeckViaDashboard(page, deckTitle);
    await openDeckEditor(page, deckTitle);
    await page.getByTestId("add-slide-type").selectOption("free");
    await page.getByTestId("add-slide-submit").click();

    const canvas = page.getByTestId("slide-canvas");
    const elements = canvas.locator("[data-free-id]");
    await expect(elements).toHaveCount(2); // starter title + text
    const title = elements.first();

    // Drag an unselected element straight away: it moves right (slide space is ~2× screen).
    const before = await left(title);
    await drag(page, title, 100, 0);
    await expect.poll(() => left(title)).toBeGreaterThan(before + 100);

    // Add a rectangle, then undo it.
    await page.getByTestId("free-add").click();
    await page.getByTestId("free-add-rect").click();
    await expect(elements).toHaveCount(3);
    await page.keyboard.press("Escape");
    await page.keyboard.press("ControlOrMeta+z");
    await expect(elements).toHaveCount(2);

    // Double-click a text to type in it.
    await title.dblclick();
    await page.keyboard.press("End");
    await page.keyboard.type(" libre");
    await page.keyboard.press("Escape");
    await expect(title).toContainText("Nouveau titre libre");

    await expect(page.getByTestId("editor-status")).toHaveText("Enregistré", { timeout: 8000 });
    const moved = await left(title);
    await page.reload();
    const reloaded = page.getByTestId("slide-canvas").locator("[data-free-id]");
    await expect(reloaded).toHaveCount(2);
    await expect(reloaded.first()).toContainText("Nouveau titre libre");
    expect(await left(reloaded.first())).toBe(moved);
  });

  test("converts a structured slide into a freeform one and can undo it", async ({ page }) => {
    const deckTitle = `Deck conversion ${Date.now()}`;
    await createDeckViaDashboard(page, deckTitle);
    await openDeckEditor(page, deckTitle);
    await page.getByTestId("add-slide-type").selectOption("problem");
    await page.getByTestId("add-slide-submit").click();

    await page.getByTestId("convert-to-free").click();
    await page.getByTestId("convert-to-free-confirm").click();
    const elements = page.getByTestId("slide-canvas").locator("[data-free-id]");
    // Headline + 3 pain points (title and text each), plus their 3 cards.
    await expect(elements).toHaveCount(10);
    await expect(page.getByTestId("free-fields-hint")).toBeVisible();

    // Undo from the toast brings the problem slide back.
    // (The toolbar's undo button is also called "Annuler": click the toast's.)
    await page.locator("[data-sonner-toast]").getByRole("button", { name: "Annuler" }).click();
    await expect(page.getByTestId("free-editor")).toHaveCount(0);
    await expect(page.getByTestId("slide-canvas").locator("[data-edit-item]")).toHaveCount(3);
    await expect(page.getByTestId("editor-status")).toHaveText("Enregistré", { timeout: 8000 });
  });
});
