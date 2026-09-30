import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { themes } from "@/lib/db/schema";
import { systemThemes } from "@/lib/slides/theme";

const SYSTEM_THEME_IDS: Record<string, string> = {
  "getfunnels-dark": "40000000-0000-4000-8000-000000000001",
  "getfunnels-light": "40000000-0000-4000-8000-000000000002",
  midnight: "40000000-0000-4000-8000-000000000003",
  editorial: "40000000-0000-4000-8000-000000000004",
  minimal: "40000000-0000-4000-8000-000000000005",
};

export async function seedThemes(connectionString?: string): Promise<void> {
  const url = connectionString || process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/getfunnels";
  const pool = new Pool({ connectionString: url });
  const db = drizzle({ client: pool, schema: { themes } });

  console.log("Seeding system themes...");

  for (const theme of systemThemes) {
    const id = SYSTEM_THEME_IDS[theme.id];
    if (!id) {
      throw new Error(`No canonical UUID mapped for system theme "${theme.id}"`);
    }

    await db
      .insert(themes)
      .values({
        id,
        orgId: null,
        name: theme.name,
        tokens: theme,
        isSystem: true,
      })
      .onConflictDoUpdate({
        target: themes.id,
        set: {
          name: theme.name,
          tokens: theme,
          isSystem: true,
          updatedAt: new Date(),
        },
      });
    console.log(`  ✓ ${theme.name} (${id})`);
  }

  console.log("System themes seeded!");
  await pool.end();
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/").split("/").pop() ?? "")) {
  seedThemes().catch((err) => {
    console.error("Seed themes failed:", err);
    process.exit(1);
  });
}
