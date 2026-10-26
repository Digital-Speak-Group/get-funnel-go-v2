import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createDeckViaDashboard, login, openDeckEditor } from "./helpers";

/**
 * axe (WCAG 2.1 A/AA) on every surface (Task 51). Slide content is excluded: it follows the
 * deck's own theme, chosen by the user, not the product chrome.
 */
const SLIDE_AREAS = ['[data-testid="slide-canvas"]', '[data-testid="slide-list"] [inert]', '[role="img"]', '[data-free-canvas]'];

async function expectNoViolations(page: Page, name: string) {
  let builder = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]);
  for (const selector of SLIDE_AREAS) builder = builder.exclude(selector);
  const { violations } = await builder.analyze();
  const summary = violations.map((v) => `${name}: ${v.id} (${v.nodes.length}) ${v.nodes[0]?.target.join(" ")}`);
  expect(summary).toEqual([]);
}

/** Sum of layout shifts since navigation (no user input), via the buffered PerformanceObserver. */
async function layoutShift(page: Page): Promise<number> {
  return page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        let total = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
            if (!entry.hadRecentInput) total += entry.value;
          }
        }).observe({ type: "layout-shift", buffered: true });
        setTimeout(() => resolve(total), 500);
      })
  );
}

test.describe("accessibility", () => {
  test("public pages", async ({ page }) => {
    for (const path of ["/", "/pricing", "/login", "/signup", "/forgot-password", "/reset-password", "/legal/terms", "/legal/privacy", "/legal/mentions"]) {
      // Not "networkidle": the landing's live preview keeps loading as it advances.
      await page.goto(path, { waitUntil: "load" });
      await page.waitForTimeout(1500);
      await expectNoViolations(page, path);
    }
  });

  test("app pages, with no layout shift on dashboard and editor load", async ({ page, context }) => {
    test.setTimeout(120000);
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await login(page);

    for (const path of ["/app", "/app/new", "/app/templates", "/app/settings/profile", "/app/settings/organization", "/app/settings/billing"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await expectNoViolations(page, path);
    }

    await page.goto("/app");
    await page.waitForLoadState("networkidle");
    expect(await layoutShift(page)).toBeLessThan(0.1);

    const title = `Deck a11y ${Date.now()}`;
    await createDeckViaDashboard(page, title);
    await openDeckEditor(page, title);
    await page.getByTestId("add-slide-type").selectOption("problem");
    await page.getByTestId("add-slide-submit").click();
    await expect(page.getByTestId("editor-status")).toBeVisible();
    await page.reload();
    await page.waitForLoadState("networkidle");
    expect(await layoutShift(page)).toBeLessThan(0.1);
    await expectNoViolations(page, "editor");

    // Audience link from the editor, then the audience and presenter views.
    await page.getByRole("button", { name: /Lien audience/ }).click();
    const audienceUrl = await page.evaluate(() => navigator.clipboard.readText());
    const deckUrl = page.url();

    await page.goto(deckUrl.replace("/app/decks/", "/present/"));
    await expect(page.getByRole("button", { name: /Démarrer/ })).toBeVisible();
    await expectNoViolations(page, "presenter");

    await page.goto(audienceUrl);
    await expect(page.locator("[data-slide-index]")).toBeVisible();
    await expectNoViolations(page, "audience");
  });
});
