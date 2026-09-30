import "server-only";
import { db } from "@/lib/db/client";
import { templates } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { z } from "zod";

const TemplateConfigSchema = z.object({
  stages: z.array(z.string()),
});

export interface SystemTemplate {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  config: {
    stages: string[];
  };
}

export async function listSystemTemplates(): Promise<SystemTemplate[]> {
  const rows = await db
    .select({ 
      id: templates.id, 
      name: templates.name, 
      slug: templates.slug, 
      description: templates.description,
      config: templates.config 
    })
    .from(templates)
    .where(eq(templates.isSystem, true))
    .orderBy(asc(templates.name));

  const result: SystemTemplate[] = [];
  for (const row of rows) {
    const parsed = TemplateConfigSchema.safeParse(row.config);
    if (parsed.success) {
      result.push({ 
        id: row.id, 
        name: row.name, 
        slug: row.slug,
        description: row.description,
        config: parsed.data 
      });
    }
  }
  return result;
}
