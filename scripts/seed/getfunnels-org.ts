import nextEnv from "@next/env";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { nanoid } from "nanoid";
import { z } from "zod";
import { decks, memberships, organizations, profiles, slides } from "@/lib/db/schema";
import { DeckSchema, type Deck } from "@/lib/slides/schema";
import { formatZodError, loadAllTemplates, type TemplateFile } from "./templates";

/**
 * Spec decision 10: system templates carry placeholders; the full-fidelity GetFunnels decks
 * live in this private org, visible only to its members.
 */
export const GETFUNNELS_ORG = {
  id: "50000000-0000-4000-8000-000000000002",
  name: "GetFunnels",
  slug: "getfunnels",
  plan: "agency",
} as const;

/** Supabase Auth user created by the admin API (2026-10-08); its password is never stored here. */
export const GETFUNNELS_MEMBERS = [
  {
    id: "427c7e0a-d396-4566-8fa6-093fb69b606d",
    email: "tools@digitalspeak.group",
    role: "owner",
  },
] as const;

export const ORG_DECKS_DIR = resolve(process.cwd(), "scripts/seed/getfunnels-org");

/**
 * One overlay per legacy deck: the deck is its system template with the `needsInput` slides
 * replaced by the real agency content. Slides whose blanks are filled live during the call
 * (per-prospect figures) stay placeholders and are listed in `keepPlaceholders`.
 */
export const OrgDeckOverlaySchema = z.object({
  template: z.string().min(1),
  deckId: z.string().uuid(),
  title: z.string().min(1).max(120).optional(),
  slides: z.array(
    z.object({
      position: z.number().int().min(0),
      content: z.record(z.string(), z.unknown()),
      script: z.string().max(4000).optional(),
      notes: z.string().max(2000).optional(),
    })
  ),
  keepPlaceholders: z
    .array(z.object({ position: z.number().int().min(0), reason: z.string().min(1) }))
    .default([]),
});

export type OrgDeckOverlay = z.infer<typeof OrgDeckOverlaySchema>;

export interface OrgDeck {
  id: string;
  templateId: string;
  themeId: string;
  overlay: OrgDeckOverlay;
  deck: Deck;
}

/** Applies an overlay to its template and validates the result as a full `Deck`. */
export function buildOrgDeck(overlay: OrgDeckOverlay, template: TemplateFile): OrgDeck {
  const where = `getfunnels-org/${overlay.template}`;
  const byPosition = new Map(overlay.slides.map((s) => [s.position, s]));
  const kept = new Set(overlay.keepPlaceholders.map((k) => k.position));

  for (const position of [...byPosition.keys(), ...kept]) {
    if (!template.slides[position]) throw new Error(`${where}: no slide at position ${position}`);
  }
  for (const position of kept) {
    if (byPosition.has(position)) {
      throw new Error(`${where}: position ${position} is both overlaid and kept as placeholder`);
    }
  }
  const unhandled = template.slides
    .filter((s) => s.needsInput && !byPosition.has(s.position) && !kept.has(s.position))
    .map((s) => s.position);
  if (unhandled.length > 0) {
    throw new Error(`${where}: needsInput slides neither overlaid nor kept: ${unhandled.join(", ")}`);
  }

  const merged = {
    title: overlay.title ?? template.title,
    language: template.language,
    slides: template.slides.map((slide) => {
      const patch = byPosition.get(slide.position);
      if (!patch) return slide;
      return {
        ...slide,
        content: patch.content,
        script: patch.script ?? slide.script,
        notes: patch.notes ?? slide.notes,
        needsInput: undefined,
      };
    }),
  };

  const parsed = DeckSchema.safeParse(merged);
  if (!parsed.success) {
    throw new Error(`Invalid org deck ${where}:\n${formatZodError(parsed.error)}`);
  }
  return {
    id: overlay.deckId,
    templateId: template.id,
    themeId: template.themeId,
    overlay,
    deck: parsed.data,
  };
}

export function loadOrgDecks(dir: string = ORG_DECKS_DIR): OrgDeck[] {
  const templatesBySlug = new Map(loadAllTemplates().map((t) => [t.slug, t]));
  return readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => {
      const raw: unknown = JSON.parse(readFileSync(join(dir, file), "utf-8"));
      const parsed = OrgDeckOverlaySchema.safeParse(raw);
      if (!parsed.success) {
        throw new Error(`Invalid overlay ${file}:\n${formatZodError(parsed.error)}`);
      }
      const template = templatesBySlug.get(parsed.data.template);
      if (!template) throw new Error(`${file}: unknown template "${parsed.data.template}"`);
      return buildOrgDeck(parsed.data, template);
    });
}

/**
 * Creates the org, its members' profiles/memberships and the decks. Decks are created once
 * (their present token is never rotated). On re-seed, slides nobody has edited since the seed
 * are refreshed from the overlay; slides the team edited, moved or added are left alone
 * (delete a deck to have the next seed recreate it in full).
 */
export async function seedGetFunnelsOrg(connectionString?: string): Promise<void> {
  const url =
    connectionString ||
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/getfunnels";
  const pool = new Pool({ connectionString: url });
  const db = drizzle({ client: pool, schema: { decks, memberships, organizations, profiles, slides } });

  console.log("Seeding the private GetFunnels org...");
  const orgDecks = loadOrgDecks();
  const owner = GETFUNNELS_MEMBERS.find((m) => m.role === "owner");
  if (!owner) throw new Error("GETFUNNELS_MEMBERS needs an owner");

  await db.transaction(async (tx) => {
    await tx.insert(organizations).values(GETFUNNELS_ORG).onConflictDoNothing({ target: organizations.id });

    for (const member of GETFUNNELS_MEMBERS) {
      await tx
        .insert(profiles)
        .values({ id: member.id, email: member.email })
        .onConflictDoNothing({ target: profiles.id });
      await tx
        .insert(memberships)
        .values({ orgId: GETFUNNELS_ORG.id, userId: member.id, role: member.role })
        .onConflictDoNothing({ target: [memberships.orgId, memberships.userId] });
    }

    for (const { id, templateId, themeId, deck } of orgDecks) {
      const inserted = await tx
        .insert(decks)
        .values({
          id,
          orgId: GETFUNNELS_ORG.id,
          ownerId: owner.id,
          title: deck.title,
          themeId,
          templateId,
          status: "ready",
          // Generated, never committed: the token is the audience link's only secret.
          presentToken: nanoid(32),
          language: deck.language,
        })
        .onConflictDoNothing({ target: decks.id })
        .returning({ id: decks.id });

      if (inserted.length === 0) {
        let refreshed = 0;
        for (const slide of deck.slides) {
          // Seeded slides share the deck's creation time (same transaction). One the team has
          // edited, moved or added since has a different created_at/updated_at and is skipped.
          const result = await tx.execute(sql`
            update slides s
            set type = ${slide.type},
                content = ${JSON.stringify(slide.content)}::jsonb,
                notes = ${slide.notes ?? null},
                script = ${slide.script ?? null},
                cue = ${slide.cue ? JSON.stringify(slide.cue) : null}::jsonb,
                layout = ${slide.layout ?? null}
            from decks d
            where d.id = ${id} and s.deck_id = d.id
              and s.position = ${slide.position}
              and s.created_at = d.created_at and s.updated_at = s.created_at`);
          refreshed += result.rowCount ?? 0;
        }
        console.log(`  · ${deck.title} (exists; ${refreshed} unedited slides refreshed)`);
        continue;
      }
      await tx.insert(slides).values(
        deck.slides.map((slide) => ({
          deckId: id,
          position: slide.position,
          type: slide.type,
          content: slide.content,
          notes: slide.notes,
          script: slide.script,
          cue: slide.cue ?? null,
          layout: slide.layout ?? null,
        }))
      );
      console.log(`  ✓ ${deck.title} (${deck.slides.length} slides)`);
    }
  });

  console.log("GetFunnels org seeded!");
  await pool.end();
}

if (
  process.argv[1] &&
  import.meta.url.endsWith(
    process.argv[1].replace(/\\/g, "/").split("/").pop() ?? ""
  )
) {
  nextEnv.loadEnvConfig(process.cwd());
  seedGetFunnelsOrg().catch((err) => {
    console.error("Seed GetFunnels org failed:", err);
    process.exit(1);
  });
}
