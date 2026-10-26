import * as React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { randomUUID } from "node:crypto";
import { MAX_IMAGE_BYTES, sniffImage } from "@/lib/storage/image";
import { MemoryStorageProvider } from "@/lib/storage/memory";
import { collectAssetIds } from "@/lib/slides/assets";
import { isAudienceAssetPath, requiresLogin } from "@/lib/auth/route-access";
import { AudienceAssetUrlProvider } from "@/components/slides/asset-url";
import { GallerySlide } from "@/components/slides/types/gallery";

const createAsset = vi.fn(async (input: Record<string, unknown>) => input);
const getOrgAsset = vi.fn();
const getAudienceAsset = vi.fn();
const getDeckById = vi.fn();
vi.mock("@/lib/db/repositories/assets", () => ({
  createAsset: (input: Record<string, unknown>) => createAsset(input),
  getOrgAsset: (...args: unknown[]) => getOrgAsset(...args),
  getAudienceAsset: (...args: unknown[]) => getAudienceAsset(...args),
}));
vi.mock("@/lib/db/repositories/decks", () => ({ getDeckById: (...args: unknown[]) => getDeckById(...args) }));
vi.mock("@/lib/storage/supabase", () => ({
  getStorageProvider: () => {
    throw new Error("tests pass their own storage");
  },
}));

const { uploadImage, readAudienceAsset, readOrgAsset } = await import("@/server/services/assets");

// ---- fixtures: just enough header bytes for each format ----
const png = (w: number, h: number) => {
  const b = new Uint8Array(33);
  b.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52]);
  new DataView(b.buffer).setUint32(16, w);
  new DataView(b.buffer).setUint32(20, h);
  return b;
};
const gif = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x40, 0x01, 0xf0, 0x00, 0, 0]);
const jpeg = new Uint8Array([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0x00, 0x00, // APP0, length 4
  0xff, 0xc0, 0x00, 0x11, 0x08, 0x02, 0x58, 0x03, 0x20, 0x03, 0, 0, 0, 0, // SOF0 600×800
]);
const webp = (() => {
  const b = new Uint8Array(30);
  b.set([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x58]);
  b.set([0x7f, 0x07, 0x00], 24); // width - 1 = 1919
  b.set([0x37, 0x04, 0x00], 27); // height - 1 = 1079
  return b;
})();
const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');

const ctx = { orgId: "11111111-1111-4111-8111-111111111111", userId: "u" };

describe("sniffImage", () => {
  it("recognises raster formats from their bytes, with dimensions", () => {
    expect(sniffImage(png(1024, 548))).toEqual({ mimeType: "image/png", ext: "png", width: 1024, height: 548 });
    expect(sniffImage(gif)).toMatchObject({ mimeType: "image/gif", width: 320, height: 240 });
    expect(sniffImage(jpeg)).toMatchObject({ mimeType: "image/jpeg", ext: "jpg", width: 800, height: 600 });
    expect(sniffImage(webp)).toMatchObject({ mimeType: "image/webp", width: 1920, height: 1080 });
  });

  it("rejects SVG and anything else", () => {
    expect(sniffImage(svg)).toBeNull();
    expect(sniffImage(new TextEncoder().encode("hello"))).toBeNull();
    expect(sniffImage(new Uint8Array())).toBeNull();
  });
});

describe("collectAssetIds", () => {
  it("finds assetId keys at any depth and nothing else", () => {
    const content = {
      headline: "assetId",
      items: [{ caption: "a", assetId: "id-1" }, { caption: "b" }, { nested: { assetId: "id-2" } }],
      assetId: 42,
    };
    expect([...collectAssetIds(content)].sort()).toEqual(["id-1", "id-2"]);
  });
});

describe("audience asset paths", () => {
  it("are recognised for their own rate-limit bucket and never require login", () => {
    expect(isAudienceAssetPath("/p/abc123/assets/" + randomUUID())).toBe(true);
    expect(isAudienceAssetPath("/p/abc123")).toBe(false);
    expect(isAudienceAssetPath("/p/abc123/assets/x/y")).toBe(false);
    expect(requiresLogin("/p/abc123/assets/" + randomUUID())).toBe(false);
  });
});

describe("asset service", () => {
  beforeEach(() => {
    createAsset.mockClear();
    getDeckById.mockReset();
    getOrgAsset.mockReset();
    getAudienceAsset.mockReset();
  });

  it("stores an upload under the org's folder with the sniffed type", async () => {
    const storage = new MemoryStorageProvider();
    const result = await uploadImage(png(10, 20), ctx, {}, storage);
    expect(result.ok).toBe(true);
    const id = result.ok ? result.assetId : "";
    const key = `orgs/${ctx.orgId}/${id}.png`;
    expect(await storage.get(key)).toMatchObject({ contentType: "image/png" });
    expect(createAsset).toHaveBeenCalledWith(
      expect.objectContaining({ id, storagePath: key, mimeType: "image/png", width: 10, height: 20, sizeBytes: 33 })
    );
  });

  it("refuses empty, oversized, SVG and other-org deck uploads without storing anything", async () => {
    const storage = new MemoryStorageProvider();
    expect(await uploadImage(new Uint8Array(), ctx, {}, storage)).toEqual({ ok: false, error: "EMPTY" });
    const big = new Uint8Array(MAX_IMAGE_BYTES + 1);
    big.set(png(1, 1));
    expect(await uploadImage(big, ctx, {}, storage)).toEqual({ ok: false, error: "TOO_LARGE" });
    expect(await uploadImage(svg, ctx, {}, storage)).toEqual({ ok: false, error: "UNSUPPORTED_TYPE" });
    getDeckById.mockResolvedValue(null);
    expect(await uploadImage(png(1, 1), ctx, { deckId: randomUUID() }, storage)).toEqual({
      ok: false,
      error: "DECK_NOT_FOUND",
    });
    expect(storage.size).toBe(0);
    expect(createAsset).not.toHaveBeenCalled();
  });

  it("serves only assets the access check resolves, with the recorded type", async () => {
    const storage = new MemoryStorageProvider();
    await storage.put("orgs/o/a.png", png(1, 1), "application/octet-stream");
    const record = { id: "a", orgId: "o", deckId: null, storagePath: "orgs/o/a.png", mimeType: "image/png" };

    getOrgAsset.mockResolvedValue(record);
    expect(await readOrgAsset("a", ctx, storage)).toMatchObject({ contentType: "image/png" });

    getAudienceAsset.mockResolvedValue(null); // not referenced by the token's deck
    expect(await readAudienceAsset("token", "a", storage)).toBeNull();

    getAudienceAsset.mockResolvedValue({ ...record, storagePath: "orgs/o/missing.png" });
    expect(await readAudienceAsset("token", "a", storage)).toBeNull();
  });
});

describe("gallery images", () => {
  const theme: Record<string, string> = {};
  const assetId = randomUUID();
  const content = { headline: "Preuves", items: [{ caption: "Avec image", assetId }, { caption: "Sans image" }] };

  it("loads images through the app route by default and keeps the placeholder otherwise", () => {
    render(<GallerySlide content={content} theme={theme} />);
    const img = screen.getByRole("img", { name: "Avec image" });
    expect(img).toHaveAttribute("src", `/api/assets/${assetId}`);
    expect(screen.getAllByRole("img")).toHaveLength(1);
  });

  it("uses the token route in the audience view", () => {
    render(
      <AudienceAssetUrlProvider presentToken="tok_123">
        <GallerySlide content={content} theme={theme} />
      </AudienceAssetUrlProvider>
    );
    expect(screen.getByRole("img", { name: "Avec image" })).toHaveAttribute("src", `/p/tok_123/assets/${assetId}`);
  });

  it("falls back to the placeholder when the image fails to load", () => {
    render(<GallerySlide content={content} theme={theme} />);
    fireEvent.error(screen.getByRole("img", { name: "Avec image" }));
    expect(screen.queryByRole("img", { name: "Avec image" })).toBeNull();
  });
});
