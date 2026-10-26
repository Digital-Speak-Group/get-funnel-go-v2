import { test, expect } from "@playwright/test";
import { stat } from "node:fs/promises";
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
    await expect(page.getByTestId("editor-status")).toHaveText("Enregistré", { timeout: 8000 });

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

  test("reorders slides by dragging their thumbnails, and zooms the canvas", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const deckTitle = `Deck glisser ${Date.now()}`;
    await createDeckViaDashboard(page, deckTitle);
    await openDeckEditor(page, deckTitle);
    for (const type of ["cover", "problem", "statement"]) {
      await page.getByTestId("add-slide-type").selectOption(type);
      await page.getByTestId("add-slide-submit").click();
    }
    const items = page.getByTestId("slide-item");
    await expect(items).toHaveCount(3);

    // Drag the third thumbnail above the first.
    const from = (await items.nth(2).boundingBox())!;
    const to = (await items.nth(0).boundingBox())!;
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(to.x + to.width / 2, to.y + 10, { steps: 12 });
    await page.mouse.up();
    await expect(items.first()).toHaveAttribute("data-slide-type", "statement");
    await expect(page.getByTestId("editor-status")).toHaveText("Enregistré", { timeout: 8000 });

    // Zoom in: the slide gets wider than its stage; the level resets to fit.
    const fitWidth = (await page.getByTestId("slide-canvas").boundingBox())!.width;
    const fitLabel = await page.getByTestId("canvas-zoom-value").textContent();
    await page.getByRole("button", { name: "Zoom avant" }).click();
    await expect.poll(async () => (await page.getByTestId("slide-canvas").boundingBox())!.width).toBeGreaterThan(fitWidth * 1.2);
    await page.getByTestId("canvas-zoom-value").click();
    await expect(page.getByTestId("canvas-zoom-value")).toHaveText(fitLabel!);

    await page.reload();
    await expect(items.first()).toHaveAttribute("data-slide-type", "statement");
    await expect(items.nth(1)).toHaveAttribute("data-slide-type", "cover");
  });

  test("sets a slide background and rewrites a text with AI", async ({ page }) => {
    const deckTitle = `Deck fond ${Date.now()}`;
    await createDeckViaDashboard(page, deckTitle);
    await openDeckEditor(page, deckTitle);
    await page.getByTestId("add-slide-submit").click();

    // Background: a gradient from the inspector.
    await page.getByTestId("slide-style-panel").locator("summary").click();
    await page.getByTestId("slide-bg-gradient").click();
    const canvas = page.getByTestId("slide-canvas");
    await expect(canvas.locator('[data-slide-background="gradient"]')).toHaveCount(1);

    // Rewrite the title (the AI is mocked: no credits, no network).
    await page.route("**/api/ai/rewrite", async (route) => {
      const body = route.request().postDataJSON() as { action: string; maxLength: number };
      expect(body.action).toBe("shorter");
      expect(body.maxLength).toBe(120);
      await route.fulfill({ json: { text: "Titre réécrit" } });
    });
    await canvas.locator('[data-edit-path="title"]').click();
    await page.getByTestId("rewrite-menu").click();
    await page.getByTestId("rewrite-shorter").click();
    await expect(canvas.locator('[data-edit-path="title"]')).toHaveText("Titre réécrit");

    await expect(page.getByTestId("editor-status")).toHaveText("Enregistré", { timeout: 8000 });
    await page.reload();
    const reloaded = page.getByTestId("slide-canvas");
    await expect(reloaded.locator('[data-edit-path="title"]')).toHaveText("Titre réécrit");
    await expect(reloaded.locator('[data-slide-background="gradient"]')).toHaveCount(1);
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

  test("edits text directly on the slide canvas", async ({ page }) => {
    const deckTitle = `Deck canvas ${Date.now()}`;
    await createDeckViaDashboard(page, deckTitle);
    await openDeckEditor(page, deckTitle);
    await page.getByTestId("add-slide-submit").click();

    const canvasTitle = page.getByTestId("slide-canvas").locator('[data-edit-path="title"]');
    await canvasTitle.click();
    await page.keyboard.press("ControlOrMeta+A");
    await page.keyboard.type("Titre tapé sur la slide");
    await page.keyboard.press("Enter"); // single-line field: Enter ends editing

    // The form field follows, and the usual autosave runs.
    await expect(page.getByTestId("slide-field-title")).toHaveValue("Titre tapé sur la slide");
    await expect(page.getByTestId("editor-status")).toHaveText("Enregistré", { timeout: 8000 });

    await page.reload();
    await expect(page.getByTestId("slide-canvas").locator('[data-edit-path="title"]')).toHaveText(
      "Titre tapé sur la slide"
    );
  });

  test("undoes and redoes edits across slides", async ({ page }) => {
    const deckTitle = `Deck historique ${Date.now()}`;
    await createDeckViaDashboard(page, deckTitle);
    await openDeckEditor(page, deckTitle);
    await page.getByTestId("add-slide-submit").click();
    const title = page.getByTestId("slide-canvas").locator('[data-edit-path="title"]');
    const original = (await title.textContent()) ?? "";

    // One typing burst on the canvas is one undo step.
    await title.click();
    await page.keyboard.press("ControlOrMeta+A");
    await page.keyboard.type("Titre modifié");
    await page.keyboard.press("Enter");
    await expect(title).toHaveText("Titre modifié");

    // A second slide, edited in the form.
    await page.getByTestId("add-slide-type").selectOption("problem");
    await page.getByTestId("add-slide-submit").click();
    await page.getByTestId("slide-field-headline").fill("Autre titre");
    await page.getByTestId("slide-field-headline").blur();

    // Undo goes back through both slides, reselecting the first one.
    await page.keyboard.press("ControlOrMeta+z");
    await expect(page.getByTestId("slide-field-headline")).not.toHaveValue("Autre titre");
    await page.keyboard.press("ControlOrMeta+z");
    await expect(title).toHaveText(original);

    await page.getByTestId("editor-redo").click();
    await expect(title).toHaveText("Titre modifié");
    await expect(page.getByTestId("editor-status")).toHaveText("Enregistré", { timeout: 8000 });
    await page.reload();
    await expect(page.getByTestId("slide-canvas").locator('[data-edit-path="title"]')).toHaveText("Titre modifié");
  });

  test("duplicates, deletes and restores list items on the canvas", async ({ page }) => {
    const deckTitle = `Deck items ${Date.now()}`;
    await createDeckViaDashboard(page, deckTitle);
    await openDeckEditor(page, deckTitle);
    await page.getByTestId("add-slide-type").selectOption("problem");
    await page.getByTestId("add-slide-submit").click();

    const canvas = page.getByTestId("slide-canvas");
    const items = canvas.locator("[data-edit-item]");
    await expect(items).toHaveCount(3); // problem slides start at the schema minimum

    // At the minimum, delete is disabled; duplicate adds a fourth.
    await items.first().hover();
    await expect(items.first().getByRole("button", { name: "Supprimer" })).toBeDisabled();
    await items.first().getByRole("button", { name: "Dupliquer" }).click();
    await expect(items).toHaveCount(4);

    // Delete, then undo from the toast (the top bar's undo is also named "Annuler…").
    await items.nth(3).hover();
    await items.nth(3).getByRole("button", { name: "Supprimer" }).click();
    await expect(items).toHaveCount(3);
    await page.locator("[data-sonner-toast]").getByRole("button", { name: "Annuler" }).click();
    await expect(items).toHaveCount(4);

    await expect(page.getByTestId("editor-status")).toHaveText("Enregistré", { timeout: 8000 });
    await page.reload();
    await expect(page.getByTestId("slide-canvas").locator("[data-edit-item]")).toHaveCount(4);
  });

  test("adds an image directly on the canvas", async ({ page }) => {
    const deckTitle = `Deck image ${Date.now()}`;
    await createDeckViaDashboard(page, deckTitle);
    await openDeckEditor(page, deckTitle);
    await page.getByTestId("add-slide-type").selectOption("gallery");
    await page.getByTestId("add-slide-submit").click();

    const canvas = page.getByTestId("slide-canvas");
    const chooser = page.waitForEvent("filechooser");
    await canvas.getByRole("button", { name: "Ajouter une image" }).first().click();
    // 8×8 red PNG
    await (await chooser).setFiles({
      name: "rouge.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAEklEQVR4nGP4z8CAFTEMLQkAc6g/wd7nXIEAAAAASUVORK5CYII=",
        "base64"
      ),
    });

    await expect(canvas.locator("img")).toHaveCount(1, { timeout: 15000 });
    await expect(page.getByTestId("editor-status")).toHaveText("Enregistré", { timeout: 8000 });
    await page.reload();
    await expect(page.getByTestId("slide-canvas").locator("img")).toHaveCount(1);
  });

  test("exports the deck as PowerPoint", async ({ page }) => {
    const deckTitle = `Deck export ${Date.now()}`;
    await createDeckViaDashboard(page, deckTitle);
    await openDeckEditor(page, deckTitle);

    await page.getByTestId("add-slide-submit").click();
    await page.getByTestId("slide-field-title").fill("Slide exportée");
    await expect(page.getByTestId("editor-status")).toHaveText("Enregistré", { timeout: 8000 });

    // Headless Chrome renders every slide on the server: allow a few seconds.
    const download = page.waitForEvent("download", { timeout: 45000 });
    await page.getByTestId("export-menu").click();
    await page.getByTestId("export-pptx").click();
    const file = await download;

    expect(file.suggestedFilename()).toBe(`${deckTitle}.pptx`);
    const { size } = await stat(await file.path());
    expect(size).toBeGreaterThan(10_000);
  });
});
