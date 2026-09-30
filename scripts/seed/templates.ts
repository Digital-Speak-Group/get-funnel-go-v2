import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { z } from "zod";
import { templates } from "@/lib/db/schema";
import { DeckSchema } from "@/lib/slides/schema";

const templateMeta = {
  id: z.string().uuid(),
  slug: z.string().min(1).max(80),
  name: z.string().min(1).max(120),
  category: z.string().min(1).max(60),
  description: z.string().min(1).max(500),
  themeId: z.string().uuid(),
};

/**
 * One ported legacy deck per file. Validated as a full `Deck` (title, language,
 * 5–40 schema-valid slides with notes/scripts) plus template-row metadata.
 */
export const TemplateFileSchema = DeckSchema.extend(templateMeta);

export type TemplateFile = z.infer<typeof TemplateFileSchema>;

export const TEMPLATES_DIR = resolve(process.cwd(), "scripts/seed/templates");

export function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
}

export function loadTemplateFile(filePath: string): TemplateFile {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(filePath, "utf-8"));
  } catch (err) {
    throw new Error(`Cannot read/parse ${filePath}: ${String(err)}`);
  }
  const parsed = TemplateFileSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Invalid template file ${filePath}:\n${formatZodError(parsed.error)}`
    );
  }
  return parsed.data;
}

export function loadAllTemplates(dir: string = TEMPLATES_DIR): TemplateFile[] {
  return readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => loadTemplateFile(join(dir, file)));
}

/** `templates.config` payload: AI stage plan + slides materialized by `createDeckFromTemplate`. */
export function templateConfig(t: TemplateFile) {
  return {
    stages: t.slides.map((slide) => slide.type),
    defaultSlideCount: t.slides.length,
    slides: t.slides.map((slide) => ({
      type: slide.type,
      content: slide.content,
      notes: slide.notes,
      script: slide.script,
    })),
  };
}

/** Full system-template row derived from a ported deck file. */
export function templateRow(t: TemplateFile) {
  return {
    id: t.id,
    orgId: null,
    slug: t.slug,
    name: t.name,
    category: t.category,
    description: t.description,
    themeId: t.themeId,
    slideCount: String(t.slides.length),
    config: templateConfig(t),
    isSystem: true,
  };
}

export async function seedTemplates(connectionString?: string): Promise<void> {
  const url =
    connectionString ||
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/getfunnels";
  const pool = new Pool({ connectionString: url });
  const db = drizzle({ client: pool, schema: { templates } });

  console.log("Seeding system templates...");
  const files = loadAllTemplates();

  for (const file of files) {
    const row = templateRow(file);
    await db
      .insert(templates)
      .values({
        ...row,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: templates.id,
        set: {
          slug: row.slug,
          name: row.name,
          category: row.category,
          description: row.description,
          themeId: row.themeId,
          slideCount: row.slideCount,
          config: row.config,
          isSystem: true,
          updatedAt: new Date(),
        },
      });
    console.log(`  ✓ ${row.name} (${row.slug}, ${file.slides.length} slides)`);
  }

  console.log("System templates seeded!");
  await pool.end();
}

if (
  process.argv[1] &&
  import.meta.url.endsWith(
    process.argv[1].replace(/\\/g, "/").split("/").pop() ?? ""
  )
) {
  seedTemplates().catch((err) => {
    console.error("Seed templates failed:", err);
    process.exit(1);
  });
}
