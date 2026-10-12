import * as React from "react";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { SlideRenderer } from "@/components/slides/SlideRenderer";
import { SlideEditProvider } from "@/components/slides/editable";
import { SLIDE_LAYOUTS } from "@/lib/slides/layouts";
import { buildDefaultContent } from "@/lib/slides/defaults";
import { SLIDE_TYPES, type Slide, type SlideType } from "@/lib/slides/schema";
import { defaultTheme } from "@/lib/slides/theme";

/**
 * Every editable text on the canvas must point at the content string it shows: a wrong
 * path would silently write the user's text into another field. Renders every slide of
 * the seeded templates and GetFunnels decks, in every layout variant, in edit mode.
 */

type SeedSlide = { type?: string; position: number; content: Record<string, unknown> };

const SEED = join(process.cwd(), "scripts", "seed");
const readJson = (path: string) => JSON.parse(readFileSync(path, "utf8"));

function seedSlides(): { name: string; type: SlideType; content: Record<string, unknown> }[] {
  const out: { name: string; type: SlideType; content: Record<string, unknown> }[] = [];
  const typesBySlug = new Map<string, Map<number, string>>();

  for (const file of readdirSync(join(SEED, "templates"))) {
    const template = readJson(join(SEED, "templates", file));
    const types = new Map<number, string>();
    for (const slide of template.slides as SeedSlide[]) {
      types.set(slide.position, slide.type!);
      out.push({ name: `${file} #${slide.position}`, type: slide.type as SlideType, content: slide.content });
    }
    typesBySlug.set(template.slug, types);
  }

  for (const file of readdirSync(join(SEED, "getfunnels-org")).filter((f) => f.endsWith(".json"))) {
    const overlay = readJson(join(SEED, "getfunnels-org", file));
    const types = typesBySlug.get(overlay.template);
    for (const slide of overlay.slides as SeedSlide[]) {
      const type = types?.get(slide.position);
      if (type) out.push({ name: `org/${file} #${slide.position}`, type: type as SlideType, content: slide.content });
    }
  }

  for (const type of SLIDE_TYPES) {
    out.push({ name: `default ${type}`, type, content: buildDefaultContent(type) as Record<string, unknown> });
  }
  return out;
}

function getAtPath(content: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>(
    (node, key) => (node && typeof node === "object" ? (node as Record<string, unknown>)[key] : undefined),
    content
  );
}

const noop = () => {};
const label = (path: string) => path;
const items = { can: () => true, act: noop, label: (action: string) => action };
const images = { pick: noop, remove: noop, label: (action: string) => action };

describe("editable text paths", () => {
  const slides = seedSlides();

  it("covers every slide type", () => {
    expect(new Set(slides.map((s) => s.type))).toEqual(new Set(SLIDE_TYPES));
  });

  it("point at the string each editable text displays, in every layout", () => {
    const problems: string[] = [];
    let checked = 0;

    for (const { name, type, content } of slides) {
      const layouts: (string | undefined)[] = [undefined, ...((SLIDE_LAYOUTS as Record<string, readonly string[]>)[type] ?? [])];
      for (const layout of layouts) {
        const slide = { id: "00000000-0000-4000-8000-000000000001", position: 0, type, content, layout } as Slide;
        const { container } = render(
          <SlideEditProvider onEdit={noop} placeholderFor={label} items={items} images={images}>
            <SlideRenderer slide={slide} theme={defaultTheme} />
          </SlideEditProvider>
        );
        for (const el of container.querySelectorAll<HTMLElement>("[data-edit-path]")) {
          const path = el.dataset.editPath!;
          const value = getAtPath(content, path);
          checked++;
          if (value !== undefined && typeof value !== "string") {
            problems.push(`${name} [${layout ?? "default"}] ${path}: not a string (${typeof value})`);
          } else if ((value ?? "") !== el.textContent) {
            problems.push(`${name} [${layout ?? "default"}] ${path}: shows "${el.textContent}", path holds "${value}"`);
          }
        }
        for (const el of container.querySelectorAll<HTMLElement>("[data-edit-item]")) {
          const itemPath = el.dataset.editItem!;
          const [, listPath, index] = itemPath.match(/^(.*)\.(\d+)$/) ?? [];
          const list = listPath ? getAtPath(content, listPath) : undefined;
          checked++;
          if (!Array.isArray(list) || Number(index) >= list.length) {
            problems.push(`${name} [${layout ?? "default"}] item ${itemPath}: no such list item`);
          }
        }
        for (const el of container.querySelectorAll<HTMLElement>("[data-edit-image]")) {
          const imagePath = el.dataset.editImage!;
          const parent = getAtPath(content, imagePath.split(".").slice(0, -1).join("."));
          const value = getAtPath(content, imagePath);
          checked++;
          if (!imagePath.endsWith(".assetId") || !parent || typeof parent !== "object" || (value !== undefined && typeof value !== "string")) {
            problems.push(`${name} [${layout ?? "default"}] image ${imagePath}: not an assetId of an existing item`);
          }
        }
        cleanup();
      }
    }

    expect(problems).toEqual([]);
    expect(checked).toBeGreaterThan(1000);
  });
});
