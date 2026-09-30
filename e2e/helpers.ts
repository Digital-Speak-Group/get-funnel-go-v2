import { expect, type Page } from "@playwright/test";

const EMAIL = process.env.E2E_EMAIL ?? process.env.SEED_DEMO_EMAIL;
const PASSWORD = process.env.E2E_PASSWORD ?? process.env.SEED_DEMO_PASSWORD;

export async function login(page: Page): Promise<void> {
  if (!EMAIL || !PASSWORD) {
    throw new Error(
      "Dashboard e2e requires E2E_EMAIL + E2E_PASSWORD (or SEED_DEMO_EMAIL + SEED_DEMO_PASSWORD) in the environment."
    );
  }

  await page.goto("/login");
  await page.getByPlaceholder("vous@exemple.com").fill(EMAIL);
  await page.getByPlaceholder("••••••••").fill(PASSWORD);
  await page.getByRole("button", { name: /Se connecter/ }).click();
  await page.waitForURL(/\/(app|onboarding)/, { timeout: 30000 });
}

export async function createDeckViaDashboard(
  page: Page,
  title: string
): Promise<void> {
  await page.goto("/app");
  await page.getByTestId("create-deck-open").click();
  await page.getByLabel("Titre", { exact: true }).fill(title);
  await page.getByRole("button", { name: "Créer le deck" }).click();
  
  // Wait for the modal to close as a signal that creation finished
  const modal = page.getByRole("dialog", { name: "Nouveau deck" });
  await expect(modal).not.toBeVisible({ timeout: 15000 });
  
  // Reload the page to guarantee fresh data in E2E tests against Next.js App Router
  // This bypasses `router.refresh()` throttling/caching issues during parallel test runs.
  await page.reload();
  
  const card = page.locator(
    `[data-testid="deck-card"][data-deck-title="${title}"]`
  );
  await expect(card).toBeVisible({ timeout: 15000 });
}

export async function openDeckEditor(page: Page, title: string): Promise<void> {
  const card = page.locator(
    `[data-testid="deck-card"][data-deck-title="${title}"]`
  );
  await expect(card).toBeVisible({ timeout: 10000 });
  await card.getByLabel("Éditer").click();
  await expect(page).toHaveURL(/\/app\/decks\/[0-9a-f-]{36}$/, {
    timeout: 60000,
  });
}
