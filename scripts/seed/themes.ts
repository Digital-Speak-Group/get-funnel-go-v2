import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { themes } from "@/lib/db/schema";
import { systemThemes } from "@/lib/slides/theme";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/getfunnels";

const pool = new Pool({ connectionString });
const db = drizzle({ client: pool, schema: { themes } });

export async function seedThemes() {
  console.log("Seeding system themes...");

  for (const theme of systemThemes) {
    await db
      .insert(themes)
      .values({
        id: theme.id,
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
    console.log(`  ✓ ${theme.name} (${theme.id})`);
  }

  console.log("System themes seeded!");
  await pool.end();
}

seedThemes().catch((err) => {
  console.error("Seed themes failed:", err);
  pool.end();
  process.exit(1);
});