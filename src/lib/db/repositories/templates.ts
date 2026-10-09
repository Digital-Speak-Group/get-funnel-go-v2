import "server-only";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db/client";
import { templates, themes } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { z } from "zod";
import { SlideSchema, parseScriptCue, type Slide } from "@/lib/slides/schema";
import { validLayout } from "@/lib/slides/layouts";
import { defaultTheme, ThemeTokensSchema, type ThemeTokens } from "@/lib/slides/theme";

const TemplateSlidesSchema = z.object({
  slides: z.array(z.record(z.string(), z.unknown())).default([]),
});

export interface TemplateGalleryItem {
  id: string;
  name: string;
  category: string;
  description: string | null;
  theme: ThemeTokens;
  /** Schema-valid slides with synthetic ids, for thumbnails and the preview strip. */
  slides: Slide[];
}

/** System templates with their theme and renderable slides (template gallery). */
export async function listTemplateGallery(): Promise<TemplateGalleryItem[]> {
  const rows = await db
    .select({
      id: templates.id,
      name: templates.name,
      category: templates.category,
      description: templates.description,
      config: templates.config,
      themeTokens: themes.tokens,
    })
    .from(templates)
    .leftJoin(themes, eq(templates.themeId, themes.id))
    .where(eq(templates.isSystem, true))
    .orderBy(asc(templates.name));

  return rows.map((row) => {
    const theme = ThemeTokensSchema.safeParse(row.themeTokens);
    const config = TemplateSlidesSchema.safeParse(row.config);
    const slides = (config.success ? config.data.slides : []).flatMap((raw, position) => {
      const parsed = SlideSchema.safeParse({
        ...raw,
        notes: raw.notes ?? undefined,
        script: raw.script ?? undefined,
        cue: parseScriptCue(raw.cue),
        layout: validLayout(String(raw.type), raw.layout),
        id: randomUUID(),
        position,
      });
      return parsed.success ? [parsed.data] : [];
    });
    return {
      id: row.id,
      name: row.name,
      category: row.category,
      description: row.description,
      theme: theme.success ? theme.data : defaultTheme,
      slides,
    };
  });
}

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
