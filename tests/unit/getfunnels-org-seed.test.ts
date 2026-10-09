/**
 * tests/unit/getfunnels-org-seed.test.ts
 *
 * The private GetFunnels org decks (Task 57, spec decision 10) are the system templates
 * with their `needsInput` slides overlaid by the real agency content. Every overlay in
 * `scripts/seed/getfunnels-org/` must:
 *   - build a schema-valid deck with the same slide order as its template
 *   - fill every placeholder slide, except the per-prospect blanks listed in `keepPlaceholders`
 *   - carry no storage links (images are assets in our StorageProvider, never Base44 URLs);
 *     the only URLs are embed/showcase pages on the allow-list (Task 60)
 */

import { describe, it, expect } from "vitest";
import { isAllowedEmbedUrl } from "@/lib/slides/embed";
import { buildOrgDeck, loadOrgDecks, type OrgDeckOverlay } from "../../scripts/seed/getfunnels-org";
import { loadAllTemplates } from "../../scripts/seed/templates";

const LEGACY_DECKS = [
  "rdv-classique", "lancement-orchestre", "vsl-funnel", "tunnel-webinaire",
  "evergreen", "tunnel-pay", "pitch-commercial",
];

// Any bracketed blank the scrubbed templates use ("[Votre nom]", "[Client 1]", "[X €]"…).
// Quotes/braces are excluded so JSON arrays in the stringified content don't match.
const PLACEHOLDER = /\[[^[\]\n"{}]{1,80}\]/;

const templates = loadAllTemplates();
const templatesBySlug = new Map(templates.map((t) => [t.slug, t]));
const orgDecks = loadOrgDecks();

describe("GetFunnels org decks", () => {
  it("has one overlay per legacy deck", () => {
    expect(orgDecks.map((d) => d.overlay.template).sort()).toEqual([...LEGACY_DECKS].sort());
  });

  it("uses unique deck ids", () => {
    const ids = orgDecks.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  for (const orgDeck of orgDecks) {
    const { overlay, deck } = orgDeck;

    describe(overlay.template, () => {
      const template = templatesBySlug.get(overlay.template)!;

      it("keeps the template's slide order, theme and template link", () => {
        expect(deck.slides.map((s) => s.type)).toEqual(template.slides.map((s) => s.type));
        expect(orgDeck.themeId).toBe(template.themeId);
        expect(orgDeck.templateId).toBe(template.id);
      });

      it("fills every placeholder slide outside the per-prospect blanks", () => {
        const kept = new Set(overlay.keepPlaceholders.map((k) => k.position));
        const leftovers = deck.slides
          .filter((s) => template.slides[s.position].needsInput && !kept.has(s.position))
          .filter((s) => PLACEHOLDER.test(JSON.stringify([s.content, s.script])))
          .map((s) => `${s.position}: ${JSON.stringify([s.content, s.script]).match(PLACEHOLDER)?.[0]}`);
        expect(leftovers).toEqual([]);
      });

      it("contains no storage links, and only allow-listed embed URLs", () => {
        const text = JSON.stringify(deck);
        expect(text).not.toMatch(/supabase\.co|base44/i);
        const urls = text.match(/https?:\/\/[^"\s]+/g) ?? [];
        expect(urls.filter((url) => !isAllowedEmbedUrl(url))).toEqual([]);
      });
    });
  }
});

describe("buildOrgDeck", () => {
  const template = templatesBySlug.get("rdv-classique")!;
  const placeholderSlides = template.slides.filter((s) => s.needsInput).map((s) => s.position);
  const overlay = (patch: Partial<OrgDeckOverlay>): OrgDeckOverlay => ({
    template: "rdv-classique",
    deckId: "20000000-0000-4000-8000-000000000999",
    slides: [],
    keepPlaceholders: placeholderSlides.map((position) => ({ position, reason: "test" })),
    ...patch,
  });

  it("rejects a placeholder slide that is neither overlaid nor kept", () => {
    expect(() => buildOrgDeck(overlay({ keepPlaceholders: [] }), template)).toThrow(/neither overlaid nor kept/);
  });

  it("rejects content that breaks the slide schema", () => {
    const [first, ...rest] = placeholderSlides;
    const bad = overlay({
      slides: [{ position: first, content: { headline: "x".repeat(500) } }],
      keepPlaceholders: rest.map((position) => ({ position, reason: "test" })),
    });
    expect(() => buildOrgDeck(bad, template)).toThrow(/Invalid org deck/);
  });

  it("rejects positions outside the template", () => {
    const bad = overlay({ keepPlaceholders: [...overlay({}).keepPlaceholders, { position: 99, reason: "test" }] });
    expect(() => buildOrgDeck(bad, template)).toThrow(/no slide at position 99/);
  });

  it("keeps the template script when the overlay gives none", () => {
    const [first, ...rest] = placeholderSlides;
    const built = buildOrgDeck(
      overlay({
        slides: [{ position: first, content: template.slides[first].content }],
        keepPlaceholders: rest.map((position) => ({ position, reason: "test" })),
      }),
      template
    );
    expect(built.deck.slides[first].script).toBe(template.slides[first].script);
    expect(built.deck.slides[first].needsInput).toBeUndefined();
  });
});
