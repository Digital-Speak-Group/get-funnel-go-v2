import { describe, expect, it, vi, beforeEach } from "vitest";
import { updateProfileAction, updateOrganizationAction } from "@/app/(app)/app/settings/actions";
import * as sessionModule from "@/lib/auth/session";
import * as profilesRepo from "@/lib/db/repositories/profiles";
import * as orgsRepo from "@/lib/db/repositories/organizations";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/db/repositories/profiles", () => ({
  updateProfile: vi.fn(),
}));

vi.mock("@/lib/db/repositories/organizations", () => ({
  updateOrganization: vi.fn(),
}));

describe("Settings actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("updateProfileAction", () => {
    it("returns error if user is not authenticated", async () => {
      vi.mocked(sessionModule.getSession).mockResolvedValue(null);

      const res = await updateProfileAction({ fullName: "New Name", locale: "fr" });
      expect(res).toEqual({ error: "Non authentifié" });
      expect(profilesRepo.updateProfile).not.toHaveBeenCalled();
    });

    it("returns error if name exceeds maximum length", async () => {
      vi.mocked(sessionModule.getSession).mockResolvedValue({
        userId: "user-1",
        activeOrgId: "org-1",
        role: "owner",
      });

      const res = await updateProfileAction({ fullName: "a".repeat(101), locale: "fr" });
      expect(res.error).toBeDefined();
      expect(profilesRepo.updateProfile).not.toHaveBeenCalled();
    });

    it("updates profile and returns success on valid input", async () => {
      vi.mocked(sessionModule.getSession).mockResolvedValue({
        userId: "user-1",
        activeOrgId: "org-1",
        role: "owner",
      });
      vi.mocked(profilesRepo.updateProfile).mockResolvedValue({} as any);

      const res = await updateProfileAction({ fullName: "Marie Curie", locale: "fr" });
      expect(res).toEqual({ success: true });
      expect(profilesRepo.updateProfile).toHaveBeenCalledWith("user-1", {
        fullName: "Marie Curie",
        locale: "fr",
      });
    });
  });

  describe("updateOrganizationAction", () => {
    it("returns error if not authenticated", async () => {
      vi.mocked(sessionModule.getSession).mockResolvedValue(null);

      const res = await updateOrganizationAction({ name: "New Org" });
      expect(res).toEqual({ error: "Non authentifié" });
      expect(orgsRepo.updateOrganization).not.toHaveBeenCalled();
    });

    it("returns error if user is a viewer or editor (not owner or admin)", async () => {
      vi.mocked(sessionModule.getSession).mockResolvedValue({
        userId: "user-1",
        activeOrgId: "org-1",
        role: "viewer",
      });

      const res = await updateOrganizationAction({ name: "New Org" });
      expect(res.error).toBe("Seuls les propriétaires et administrateurs peuvent modifier l'organisation.");
      expect(orgsRepo.updateOrganization).not.toHaveBeenCalled();
    });

    it("returns error if organization name is too short", async () => {
      vi.mocked(sessionModule.getSession).mockResolvedValue({
        userId: "user-1",
        activeOrgId: "org-1",
        role: "admin",
      });

      const res = await updateOrganizationAction({ name: "A" });
      expect(res.error).toBe("Le nom doit comporter au moins 2 caractères");
      expect(orgsRepo.updateOrganization).not.toHaveBeenCalled();
    });

    it("updates organization and returns success for owner", async () => {
      vi.mocked(sessionModule.getSession).mockResolvedValue({
        userId: "user-1",
        activeOrgId: "org-1",
        role: "owner",
      });
      vi.mocked(orgsRepo.updateOrganization).mockResolvedValue({} as any);

      const res = await updateOrganizationAction({ name: "Digital Speak Enterprise" });
      expect(res).toEqual({ success: true });
      expect(orgsRepo.updateOrganization).toHaveBeenCalledWith(
        { orgId: "org-1" },
        { name: "Digital Speak Enterprise" }
      );
    });
  });
});
