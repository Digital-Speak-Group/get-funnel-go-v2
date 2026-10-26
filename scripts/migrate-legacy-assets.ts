/**
 * One-off (idempotent): copies the legacy GetFunnels images off the Base44-hosted bucket into
 * our private storage as assets of the GetFunnels org (Task 57b). Manifest:
 * scripts/seed/getfunnels-org-assets.json. Assets already recorded are skipped, so it is safe
 * to re-run, and once it has run nothing depends on the legacy bucket any more.
 *
 *   npx tsx --conditions=react-server scripts/migrate-legacy-assets.ts
 *
 * (`react-server` lets the server-only storage module load outside Next.js.) Run after
 * `db:seed`, which creates the org.
 */
import nextEnv from "@next/env";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";

nextEnv.loadEnvConfig(process.cwd());

const LEGACY_BASE =
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699397a847582c270176930d/";

const ManifestSchema = z.object({
  assets: z.array(
    z.object({
      id: z.string().uuid(),
      kind: z.enum(["logo", "image"]),
      file: z.string().regex(/^[\w.-]+$/),
      label: z.string().min(1),
    })
  ),
});

async function main() {
  const { db } = await import("@/lib/db/client");
  const { assets } = await import("@/lib/db/schema");
  const { eq } = await import("drizzle-orm");
  const { getStorageProvider } = await import("@/lib/storage/supabase");
  const { sniffImage } = await import("@/lib/storage/image");
  const { assetStorageKey } = await import("@/server/services/assets");
  const { GETFUNNELS_ORG } = await import("./seed/getfunnels-org");

  const manifest = ManifestSchema.parse(
    JSON.parse(readFileSync(resolve(process.cwd(), "scripts/seed/getfunnels-org-assets.json"), "utf-8"))
  );
  const storage = getStorageProvider();
  let copied = 0;

  for (const entry of manifest.assets) {
    const [existing] = await db.select({ id: assets.id }).from(assets).where(eq(assets.id, entry.id));
    if (existing) {
      console.log(`  · ${entry.label} (already migrated)`);
      continue;
    }
    const res = await fetch(LEGACY_BASE + entry.file);
    if (!res.ok) throw new Error(`${entry.file}: HTTP ${res.status}`);
    const bytes = new Uint8Array(await res.arrayBuffer());
    const info = sniffImage(bytes);
    if (!info) throw new Error(`${entry.file}: not a supported image`);

    const storagePath = assetStorageKey(GETFUNNELS_ORG.id, entry.id, info.ext);
    await storage.put(storagePath, bytes, info.mimeType);
    await db.insert(assets).values({
      id: entry.id,
      orgId: GETFUNNELS_ORG.id,
      kind: entry.kind,
      storagePath,
      mimeType: info.mimeType,
      width: info.width === undefined ? null : String(info.width),
      height: info.height === undefined ? null : String(info.height),
      sizeBytes: String(bytes.byteLength),
    });
    copied++;
    console.log(`  ✓ ${entry.label} (${info.width}×${info.height}, ${Math.round(bytes.byteLength / 1024)} Ko)`);
  }
  console.log(`Legacy assets: ${copied} copied, ${manifest.assets.length - copied} already there.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Legacy asset migration failed:", err);
  process.exit(1);
});
