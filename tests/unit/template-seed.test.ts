/**
 * tests/unit/template-seed.test.ts
 *
 * Validates all ported legacy templates in `scripts/seed/templates/`.
 * Each file must:
 *   - Pass TemplateFileSchema (DeckSchema + template metadata)
 *   - Have 5–40 slides (enforced by DeckSchema)
 *   - Preserve notes / scripts where they exist
 *   - Map only canonical slide types from SLIDE_TYPES
 *
 * To add a new fixture:
 *   1. Drop the JSON file in `scripts/seed/templates/`
 *   2. Re-run this test — it auto-discovers all .json files.
 *   3. If validation fails, check the error message for the exact field/path.
 */

import { describe, it, expect } from "vitest";
import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { loadTemplateFile, templateRow, templateConfig } from "../../scripts/seed/templates";
import { SLIDE_TYPES } from "@/lib/slides/schema";

const TEMPLATES_DIR = resolve(process.cwd(), "scripts/seed/templates");

const jsonFiles = readdirSync(TEMPLATES_DIR)
  .filter((f) => f.endsWith(".json"))
  .sort();

// ---- helpers ---------------------------------------------------------------

function allSlideSlugs(file: ReturnType<typeof loadTemplateFile>) {
  return file.slides.map((s) => s.type);
}

// ---- suite -----------------------------------------------------------------

describe("template seed files", () => {
  it("discovers at least 4 templates", () => {
    expect(jsonFiles.length).toBeGreaterThanOrEqual(4);
  });

  for (const filename of jsonFiles) {
    const filePath = join(TEMPLATES_DIR, filename);

    describe(filename, () => {
      let template: ReturnType<typeof loadTemplateFile>;

      it("parses and validates without errors", () => {
        // loadTemplateFile throws on validation failure — that's the test
        template = loadTemplateFile(filePath);
        expect(template).toBeDefined();
      });

      it("has between 5 and 40 slides", () => {
        template = loadTemplateFile(filePath);
        expect(template.slides.length).toBeGreaterThanOrEqual(5);
        expect(template.slides.length).toBeLessThanOrEqual(40);
      });

      it("all slide types are canonical SLIDE_TYPES", () => {
        template = loadTemplateFile(filePath);
        const types = allSlideSlugs(template);
        for (const type of types) {
          expect(SLIDE_TYPES as readonly string[]).toContain(type);
        }
      });

      it("slide positions are sequential starting from 0", () => {
        template = loadTemplateFile(filePath);
        template.slides.forEach((slide, idx) => {
          expect(slide.position).toBe(idx);
        });
      });

      it("has a UUID id", () => {
        template = loadTemplateFile(filePath);
        expect(template.id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        );
      });

      it("has a non-empty slug that matches filename (without extension)", () => {
        template = loadTemplateFile(filePath);
        const expectedSlug = filename.replace(/\.json$/, "");
        expect(template.slug).toBe(expectedSlug);
      });

      it("has a valid themeId UUID", () => {
        template = loadTemplateFile(filePath);
        expect(template.themeId).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        );
      });

      it("templateConfig stages length matches slides length", () => {
        template = loadTemplateFile(filePath);
        const config = templateConfig(template);
        expect(config.stages).toHaveLength(template.slides.length);
        expect(config.slides).toHaveLength(template.slides.length);
      });

      it("at least one slide has a script preserved", () => {
        template = loadTemplateFile(filePath);
        const withScript = template.slides.filter((s) => s.script && s.script.trim().length > 0);
        expect(withScript.length).toBeGreaterThan(0);
      });

      it("templateRow produces valid DB insert shape", () => {
        template = loadTemplateFile(filePath);
        const row = templateRow(template);
        expect(row.id).toBe(template.id);
        expect(row.slug).toBe(template.slug);
        expect(row.isSystem).toBe(true);
        expect(row.orgId).toBeNull();
        expect(Number(row.slideCount)).toBe(template.slides.length);
      });
    });
  }
});

// ---- cross-template checks -------------------------------------------------

describe("cross-template uniqueness", () => {
  const templates = jsonFiles.map((f) =>
    loadTemplateFile(join(TEMPLATES_DIR, f))
  );

  it("all template ids are unique", () => {
    const ids = templates.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all template slugs are unique", () => {
    const slugs = templates.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("all slide ids are globally unique across templates", () => {
    const allSlideIds = templates.flatMap((t) => t.slides.map((s) => s.id));
    expect(new Set(allSlideIds).size).toBe(allSlideIds.length);
  });

  it("all 4 expected templates are present", () => {
    const slugs = templates.map((t) => t.slug);
    expect(slugs).toContain("rdv-classique");
    expect(slugs).toContain("vsl-funnel");
    expect(slugs).toContain("webinaire");
    expect(slugs).toContain("commercial");
  });
});
