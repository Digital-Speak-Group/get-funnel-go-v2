import { describe, expect, it } from "vitest";
import { requiresLogin } from "@/lib/auth/route-access";

describe("requiresLogin", () => {
  it.each(["/app", "/app/decks/123", "/app/settings/billing", "/present/123", "/onboarding"])(
    "protects %s",
    (path) => {
      expect(requiresLogin(path)).toBe(true);
    }
  );

  it.each([
    "/",
    "/login",
    "/signup",
    "/pricing",
    "/legal/terms",
    "/legal/privacy",
    "/legal/mentions",
    "/callback", // email confirmation, before any session exists
    "/opengraph-image",
    "/p/some-token",
  ])("lets %s through", (path) => {
    expect(requiresLogin(path)).toBe(false);
  });

  it.each(["/api/stripe/webhook", "/api/auth/callback", "/api/ai/generate"])(
    "never redirects route handler %s (they authenticate themselves)",
    (path) => {
      expect(requiresLogin(path)).toBe(false);
    }
  );

  it("does not treat lookalike prefixes as public", () => {
    expect(requiresLogin("/pricingx")).toBe(true);
    expect(requiresLogin("/apix")).toBe(true);
    expect(requiresLogin("/login-admin")).toBe(true);
    expect(requiresLogin("/legalx")).toBe(true);
  });
});
