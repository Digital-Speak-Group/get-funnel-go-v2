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

    // Delete, then undo from the toast.
    await items.nth(3).hover();
    await items.nth(3).getByRole("button", { name: "Supprimer" }).click();
    await expect(items).toHaveCount(3);
    await page.getByRole("button", { name: "Annuler" }).click();
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
