import { test, expect } from "@playwright/test";

/**
 * Password reset, the parts that need no real email: the pages are public, validate inline and
 * refuse a missing or bad recovery link. The full email round trip is a manual check against
 * hosted Supabase (Task 81).
 */
test.describe("password reset", () => {
  test("login links to the forgot-password page, which validates the email inline", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "Oublié ?" }).click();
    await expect(page).toHaveURL(/\/forgot-password$/);
    await expect(page.getByRole("heading", { name: "Mot de passe oublié" })).toBeVisible();

    await page.getByRole("button", { name: "Envoyer le lien" }).click();
    await expect(page.getByText("Saisissez votre email", { exact: true })).toBeVisible();

    await page.getByLabel("Email").fill("pas-un-email");
    await page.getByLabel("Email").blur();
    await expect(page.getByText("Email invalide")).toBeVisible();
  });

  test("reset page without a recovery link offers a new one", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page.getByRole("heading", { name: "Lien invalide ou expiré" })).toBeVisible();
    await page.getByRole("link", { name: "Demander un nouveau lien" }).click();
    await expect(page).toHaveURL(/\/forgot-password$/);
  });

  test("reset page with a bad code ends in the invalid-link state", async ({ page }) => {
    await page.goto("/reset-password?code=not-a-real-code");
    await expect(page.getByRole("heading", { name: "Lien invalide ou expiré" })).toBeVisible();
  });
});
