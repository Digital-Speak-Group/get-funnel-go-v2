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

  test("box-select, group, copy to another slide, lock; it all persists", async ({ page }) => {
    const deckTitle = `Deck outils ${Date.now()}`;
    await createDeckViaDashboard(page, deckTitle);
    await openDeckEditor(page, deckTitle);
    await page.getByTestId("add-slide-type").selectOption("free");
    await page.getByTestId("add-slide-submit").click();

    const canvas = page.getByTestId("slide-canvas");
    const elements = canvas.locator("[data-free-id]");
    await expect(elements).toHaveCount(2);

    // Drag a box from the empty top-left corner over both starter texts.
    const box = (await canvas.boundingBox())!;
    await page.mouse.move(box.x + 6, box.y + 6);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.4, { steps: 8 });
    await expect(page.getByTestId("free-marquee")).toBeVisible();
    await page.mouse.up();
    await expect(canvas.locator("[data-free-selected]")).toHaveCount(2);

    // Group them: a click on one now selects both.
    await page.keyboard.press("ControlOrMeta+g");
    await page.keyboard.press("Escape");
    await expect(canvas.locator("[data-free-selected]")).toHaveCount(0);
    await elements.first().click();
    await expect(canvas.locator("[data-free-selected]")).toHaveCount(2);

    // Copy, then paste onto a second freeform slide.
    await page.keyboard.press("ControlOrMeta+c");
    await page.getByTestId("add-slide-type").selectOption("free");
    await page.getByTestId("add-slide-submit").click();
    await expect(page.getByTestId("canvas-caption")).toContainText("Slide 2");
    await page.keyboard.press("ControlOrMeta+v");
    await expect(elements).toHaveCount(4);

    // Lock the pasted group (it is selected after the paste): Delete leaves it alone.
    await page.getByTestId("free-lock").click();
    await page.keyboard.press("Delete");
    await expect(elements).toHaveCount(4);
    await expect(canvas.locator("[data-free-locked]")).toHaveCount(2);

    // The right-click menu unlocks it again.
    await elements.last().click({ button: "right" });
    await page.getByTestId("free-menu-lock").click();
    await expect(canvas.locator("[data-free-locked]")).toHaveCount(0);

    await expect(page.getByTestId("editor-status")).toHaveText("Enregistré", { timeout: 8000 });
    await page.reload();
    await page.getByTestId("slide-item").nth(1).click();
    await expect(page.getByTestId("slide-canvas").locator("[data-free-id]")).toHaveCount(4);
  });

  test("adds a table, a chart, a video and a star; it all persists", async ({ page }) => {
    const deckTitle = `Deck données ${Date.now()}`;
    await createDeckViaDashboard(page, deckTitle);
    await openDeckEditor(page, deckTitle);
    await page.getByTestId("add-slide-type").selectOption("free");
    await page.getByTestId("add-slide-submit").click();
    const canvas = page.getByTestId("slide-canvas");
    const elements = canvas.locator("[data-free-id]");
    const add = async (kind: string) => {
      await page.getByTestId("free-add").click();
      await page.getByTestId(`free-add-${kind}`).click();
    };

    // Table: type in a cell, then add a row.
    await add("table");
    const table = elements.last();
    await expect(table.locator("tr")).toHaveCount(3);
    // Like a user: a double-click where the cell is (the element takes the first click).
    const cell = table.locator('[data-edit-path$=".rows.1.0"]');
    const cellBox = (await cell.boundingBox())!;
    await page.mouse.dblclick(cellBox.x + cellBox.width / 2, cellBox.y + cellBox.height / 2);
    await expect(cell).toBeFocused();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.type("Offre Pro");
    await page.keyboard.press("Escape");
    await expect(cell).toHaveText("Offre Pro");
    await page.getByTestId("free-table").click();
    await page.getByTestId("free-table-add-row").click();
    await page.keyboard.press("Escape");
    await expect(table.locator("tr")).toHaveCount(4);

    // Chart: change a value in its data panel.
    await add("chart");
    await page.getByTestId("free-chart").click();
    await page.getByTestId("free-chart-value-0").fill("120");
    await page.keyboard.press("Escape");
    await expect(elements.last().locator("svg")).toHaveAttribute("aria-label", /T1 : 120/);

    // Video: from a YouTube link; the editor shows a still frame.
    await page.getByTestId("free-add").click();
    await page.getByTestId("free-add-video").click();
    await page.getByTestId("free-video-url").fill("https://youtu.be/dQw4w9WgXcQ");
    await page.getByTestId("free-video-confirm").click();
    await expect(elements.last().locator("img")).toHaveAttribute("src", /i\.ytimg\.com\/vi\/dQw4w9WgXcQ/);

    // A star with a dashed border.
    await add("star");
    await page.getByTestId("free-border").click();
    await page.getByTestId("free-border-toggle").click();
    await page.keyboard.press("Escape");
    await expect(elements.last().locator("svg path")).toHaveAttribute("stroke", /var\(--slide-primary\)/);

    await expect(page.getByTestId("editor-status")).toHaveText("Enregistré", { timeout: 8000 });
    await page.reload();
    const reloaded = page.getByTestId("slide-canvas").locator("[data-free-id]");
    await expect(reloaded).toHaveCount(6);
    await expect(reloaded.nth(2).locator("tr")).toHaveCount(4);
    await expect(reloaded.nth(2)).toContainText("Offre Pro");
  });

  test("formats a freeform text: bold, bullet list, size; it persists", async ({ page }) => {
    const deckTitle = `Deck texte riche ${Date.now()}`;
    await createDeckViaDashboard(page, deckTitle);
    await openDeckEditor(page, deckTitle);
    await page.getByTestId("add-slide-type").selectOption("free");
    await page.getByTestId("add-slide-submit").click();

    const body = page.getByTestId("slide-canvas").locator("[data-free-id]").nth(1);
    await body.dblclick();
    await page.keyboard.press("ControlOrMeta+a");
    await page.getByTestId("free-mark-bold").click();
    await expect(body.locator("strong")).toHaveText("Texte à compléter.");
    await page.getByTestId("free-mark-bullet").click();
    await expect(body.locator("ul li")).toHaveCount(1);
    await page.keyboard.press("Escape");

    await page.getByTestId("free-spacing").click();
    await page.getByTestId("free-text-size").fill("40");
    await page.keyboard.press("Escape");
    await expect.poll(() => body.evaluate((n) => getComputedStyle(n.querySelector("[data-free-rich]")!).fontSize)).toBe("40px");

    await expect(page.getByTestId("editor-status")).toHaveText("Enregistré", { timeout: 8000 });
    await page.reload();
    const reloaded = page.getByTestId("slide-canvas").locator("[data-free-id]").nth(1);
    await expect(reloaded.locator("ul li strong")).toHaveText("Texte à compléter.");
  });

  test("an element with a build step appears when the presenter advances", async ({ page, context }) => {
    test.setTimeout(90000);
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const deckTitle = `Deck animation ${Date.now()}`;
    await createDeckViaDashboard(page, deckTitle);
    await openDeckEditor(page, deckTitle);
    await page.getByTestId("add-slide-type").selectOption("free");
    await page.getByTestId("add-slide-submit").click();

    // The body text appears on step 1.
    const body = page.getByTestId("slide-canvas").locator("[data-free-id]").nth(1);
    await body.click();
    await page.getByTestId("free-reveal").click();
    await page.getByTestId("free-reveal-fade").click();
    await page.keyboard.press("Escape");
    await expect(body.locator('[data-reveal-badge="1"]')).toBeVisible();
    await expect(page.getByTestId("editor-status")).toHaveText("Enregistré", { timeout: 8000 });

    await page.getByRole("button", { name: /Lien audience/ }).click();
    const audienceUrl = await page.evaluate(() => navigator.clipboard.readText());
    const audience = await context.newPage();
    await audience.goto(audienceUrl);
    const audienceBody = audience.locator("[data-free-id]").nth(1);
    await expect(audienceBody).toBeVisible();

    await page.goto(page.url().replace("/app/decks/", "/present/"));
    await expect(page.getByTestId("presenter-link-status")).toHaveText("Lien audience actif", { timeout: 15000 });
    await expect(page.getByTestId("presenter-steps")).toHaveText("Animation 0/1");
    const opacity = (loc: Locator) => loc.evaluate((n) => getComputedStyle(n).opacity);
    await expect.poll(() => opacity(audienceBody), { timeout: 10000 }).toBe("0");

    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("presenter-steps")).toHaveText("Animation 1/1");
    await expect.poll(() => opacity(audienceBody), { timeout: 10000 }).toBe("1");
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
    // (The top bar's undo button is also called "Annuler…": click the toast's.)
    await page.locator("[data-sonner-toast]").getByRole("button", { name: "Annuler" }).click();
    await expect(page.getByTestId("free-editor")).toHaveCount(0);
    await expect(page.getByTestId("slide-canvas").locator("[data-edit-item]")).toHaveCount(3);
    await expect(page.getByTestId("editor-status")).toHaveText("Enregistré", { timeout: 8000 });
  });
});
