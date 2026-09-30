import "server-only";
import { db } from "@/lib/db/client";
import { themes } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { ThemeTokensSchema, type ThemeTokens } from "@/lib/slides/theme";

export interface SystemTheme {
  id: string;
  name: string;
  tokens: ThemeTokens;
}

export async function listSystemThemes(): Promise<SystemTheme[]> {
  const rows = await db
    .select({ id: themes.id, name: themes.name, tokens: themes.tokens })
    .from(themes)
    .where(eq(themes.isSystem, true))
    .orderBy(asc(themes.name));

  const result: SystemTheme[] = [];
  for (const row of rows) {
    const parsed = ThemeTokensSchema.safeParse(row.tokens);
    if (parsed.success) {
      result.push({ id: row.id, name: row.name, tokens: parsed.data });
    }
  }
  return result;
}
