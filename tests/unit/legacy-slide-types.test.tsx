import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { SlideSchema, type Slide } from "@/lib/slides/schema";
import { buildDefaultContent } from "@/lib/slides/defaults";
import { EMBED_SANDBOX, isAllowedEmbedUrl } from "@/lib/slides/embed";
import { parseBlanksPayload, BLANK_VALUE_MAX } from "@/lib/realtime/blanks";
import { systemThemes } from "@/lib/slides/theme";
import { SlideRenderer } from "@/components/slides/SlideRenderer";
import { SlideThumbnail } from "@/components/slides/SlideThumbnail";
import { LiveBlanksProvider } from "@/components/slides/render-context";
import { BlanksInputs } from "@/components/presenter/BlanksInputs";
import { SlideFields } from "@/components/app/editor/SlideFields";
import { EMPTY_EDITOR_CUE } from "@/components/app/editor/cue";
import { loadAllTemplates } from "../../scripts/seed/templates";
import { loadOrgDecks } from "../../scripts/seed/getfunnels-org";

const theme = systemThemes[0];
const FUNNELYTICS = "https://canvas.funnelytics.io/view/2a5afdb7-90e4-4122-b317-352d05ba9924";

const slide = (type: Slide["type"], content: Record<string, unknown>): Slide =>
  ({ id: randomUUID(), position: 0, type, content }) as Slide;

describe("embed allow-list", () => {
  it("accepts https pages on listed domains and their subdomains", () => {
    expect(isAllowedEmbedUrl(FUNNELYTICS)).toBe(true);
    expect(isAllowedEmbedUrl("https://getfunnels.clickfunnels.com/optin1679655893734")).toBe(true);
    expect(isAllowedEmbedUrl("https://digitalspeak-sarl.systeme.io/amani-invest")).toBe(true);
    expect(isAllowedEmbedUrl("https://go-scale.systems/vsl")).toBe(true);
  });

  it("rejects other hosts, lookalikes, plain http and credentials", () => {
    expect(isAllowedEmbedUrl("https://example.com")).toBe(false);
    expect(isAllowedEmbedUrl("https://clickfunnels.com.evil.io/x")).toBe(false);
    expect(isAllowedEmbedUrl("https://evilclickfunnels.com/x")).toBe(false);
    expect(isAllowedEmbedUrl("http://canvas.funnelytics.io/view/1")).toBe(false);
    expect(isAllowedEmbedUrl("https://user:pass@systeme.io/")).toBe(false);
    expect(isAllowedEmbedUrl("javascript:alert(1)")).toBe(false);
    expect(isAllowedEmbedUrl("not a url")).toBe(false);
  });

  it("is enforced by the slide schema (every server write validates with it)", () => {
    const base = { headline: "Voici la machine", title: "Funnelytics" };
    expect(SlideSchema.safeParse(slide("embed", { ...base, url: FUNNELYTICS })).success).toBe(true);
    expect(SlideSchema.safeParse(slide("embed", base)).success).toBe(true);
    expect(SlideSchema.safeParse(slide("embed", { ...base, url: "https://evil.example/x" })).success).toBe(false);
    expect(
      SlideSchema.safeParse(slide("showcase", { headline: "H", items: [{ title: "A", url: "https://evil.example" }] })).success
    ).toBe(false);
  });

  it("sandboxes embeds without top navigation, and never frames the app's own site", () => {
    // allow-scripts + allow-same-origin is safe only for other origins (decided 2026-10-09).
    expect(EMBED_SANDBOX.split(" ")).toEqual(expect.arrayContaining(["allow-scripts", "allow-same-origin"]));
    expect(EMBED_SANDBOX).not.toContain("allow-top-navigation");
    const previous = process.env.NEXT_PUBLIC_APP_URL;
    try {
      process.env.NEXT_PUBLIC_APP_URL = "https://app.getfunnels.agency";
      expect(isAllowedEmbedUrl("https://app.getfunnels.agency/p/token")).toBe(false);
      expect(isAllowedEmbedUrl("https://getfunnels.agency/page")).toBe(false);
      expect(isAllowedEmbedUrl(FUNNELYTICS)).toBe(true);
    } finally {
      if (previous === undefined) {
        delete process.env.NEXT_PUBLIC_APP_URL;
      } else {
        process.env.NEXT_PUBLIC_APP_URL = previous;
      }
    }
  });

  it("allow-lists third-party domains only, never the app's configured host", () => {
    const rawUrl = process.env.NEXT_PUBLIC_APP_URL;
    const appUrl = rawUrl && rawUrl !== "undefined" ? rawUrl : "http://localhost:3000";
    const own = new URL(appUrl).hostname;
    expect(isAllowedEmbedUrl(`https://${own}/`)).toBe(false);
  });
});

describe("embed and showcase rendering", () => {
  it("renders the live page in a sandboxed iframe only when shown live", () => {
    const s = slide("embed", { headline: "Voici la machine", title: "Funnelytics", url: FUNNELYTICS });
    const { container, unmount } = render(<SlideRenderer slide={s} theme={theme} />);
    const iframe = container.querySelector("iframe");
    expect(iframe).toHaveAttribute("src", FUNNELYTICS);
    expect(iframe).toHaveAttribute("sandbox", EMBED_SANDBOX);
    expect(iframe).toHaveAttribute("referrerpolicy", "no-referrer");
    const open = screen.getByRole("link", { name: /canvas.funnelytics.io/ });
    expect(open).toHaveAttribute("target", "_blank");
    expect(open).toHaveAttribute("rel", "noopener noreferrer");
    unmount();

    const thumb = render(<SlideThumbnail slide={s} theme={theme} />);
    expect(thumb.container.querySelector("iframe")).toBeNull();
    expect(thumb.container).toHaveTextContent("Aperçu en direct pendant la présentation");
  });

  it("refuses to frame a URL that is not allow-listed even if it reaches the renderer", () => {
    const s = slide("embed", { headline: "H", title: "T", url: "https://evil.example/x" });
    const { container } = render(<SlideRenderer slide={s} theme={theme} />);
    expect(container.querySelector("iframe")).toBeNull();
    expect(container).toHaveTextContent("Domaine non autorisé");
  });

  it("switches the framed page when another showcase item is picked", () => {
    const urls = ["https://getfunnels.clickfunnels.com/a", "https://by.getfunnels.agency/b"];
    const s = slide("showcase", { headline: "H", items: [{ title: "Page A", url: urls[0] }, { title: "Page B", url: urls[1] }] });
    const { container } = render(<SlideRenderer slide={s} theme={theme} />);
    expect(container.querySelector("iframe")).toHaveAttribute("src", urls[0]);
    fireEvent.click(screen.getByRole("button", { name: /Page B/ }));
    expect(container.querySelector("iframe")).toHaveAttribute("src", urls[1]);
  });
});

describe("screenshots, gauge and mockup rendering", () => {
  const assetId = randomUUID();

  it("opens a screenshot full-size on click, but not in thumbnails", () => {
    const s = slide("screenshots", { headline: "Preuves", items: [{ caption: "Tunnel REBORN", result: "€3 608 200", assetId }, { caption: "Sans image" }] });
    render(<SlideRenderer slide={s} theme={theme} />);
    expect(screen.getByRole("img", { name: "Tunnel REBORN" })).toHaveAttribute("src", `/api/assets/${assetId}`);
    fireEvent.click(screen.getByRole("button", { name: /Tunnel REBORN/ }));
    expect(screen.getByRole("dialog", { name: "Tunnel REBORN" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("dialog"));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("button", { name: /Sans image/ })).toBeDisabled();
  });

  it("draws gauges with their value and unit", () => {
    const s = slide("gauge", {
      headline: "7 métriques",
      gauges: [{ label: "ROI", value: 3.2, max: 5, suffix: "x", note: "Objectif : 3x" }, { label: "Show-up", value: 42, suffix: "%" }],
    });
    const { container } = render(<SlideRenderer slide={s} theme={theme} />);
    expect(container).toHaveTextContent("3,2x");
    expect(container).toHaveTextContent("42%");
    expect(container).toHaveTextContent("Objectif : 3x");
  });

  it("shows a page mockup's blocks and button", () => {
    const s = slide("mockup", {
      headline: "Structure de la page d'opt-in",
      page: "optin",
      blocks: [{ label: "Titre accrocheur", detail: "Promesse forte" }, { label: "Formulaire", detail: "Nom · Email" }],
      cta: "Réserver mon RDV Gratuit",
    });
    const { container } = render(<SlideRenderer slide={s} theme={theme} />);
    for (const text of ["Page d'opt-in", "Titre accrocheur", "Nom · Email", "Réserver mon RDV Gratuit"]) {
      expect(container).toHaveTextContent(text);
    }
  });
});

describe("live blanks", () => {
  const blanks = slide("blanks", {
    headline: "Ce que votre système actuel vous coûte.",
    fields: [{ label: "Leads non capturés" }, { label: "CA non converti", suffix: "€" }],
  });

  it("shows lines until the presenter types, then the values", () => {
    const { container, rerender } = render(<SlideRenderer slide={blanks} theme={theme} />);
    expect(container.querySelectorAll('[data-blank-filled="false"]')).toHaveLength(2);
    rerender(
      <LiveBlanksProvider values={{ [blanks.id]: ["120", "18 000"] }}>
        <SlideRenderer slide={blanks} theme={theme} />
      </LiveBlanksProvider>
    );
    expect(container.querySelectorAll('[data-blank-filled="true"]')).toHaveLength(2);
    expect(container).toHaveTextContent("18 000€");
  });

  it("presenter inputs report every field's value", () => {
    const onChange = vi.fn();
    render(<BlanksInputs slide={blanks} values={[]} onChange={onChange} />);
    fireEvent.change(screen.getByTestId("presenter-blank-1"), { target: { value: "18 000" } });
    expect(onChange).toHaveBeenCalledWith(["", "18 000"]);
    expect(screen.getByTestId("presenter-blank-0")).toHaveAttribute("maxLength", String(BLANK_VALUE_MAX));
  });

  it("validates broadcast payloads before the audience uses them", () => {
    expect(parseBlanksPayload({ slideId: "s", values: ["1", "2"] })).toEqual({ slideId: "s", values: ["1", "2"] });
    expect(parseBlanksPayload(undefined)).toBeNull();
    expect(parseBlanksPayload({ slideId: "s", values: ["x".repeat(BLANK_VALUE_MAX + 1)] })).toBeNull();
    expect(parseBlanksPayload({ slideId: "s", values: Array(7).fill("1") })).toBeNull();
    expect(parseBlanksPayload({ slideId: 1, values: [] })).toBeNull();
  });
});

describe("editor support", () => {
  it("builds valid default content for every new type", () => {
    for (const type of ["embed", "showcase", "screenshots", "gauge", "mockup", "blanks"] as const) {
      expect(SlideSchema.safeParse(slide(type, buildDefaultContent(type))).success, type).toBe(true);
    }
  });

  it("edits gauge numbers as numbers", () => {
    const onChange = vi.fn();
    render(
      <SlideFields
        slide={{ id: randomUUID(), position: 0, type: "gauge", content: buildDefaultContent("gauge"), notes: "", script: "", cue: EMPTY_EDITOR_CUE }}
        errors={{}}
        onChange={onChange}
      />
    );
    const input = screen.getByTestId("slide-field-gauges.0.value");
    expect(input).toHaveAttribute("type", "number");
    fireEvent.change(input, { target: { value: "42.5" } });
    const content = onChange.mock.calls.at(-1)?.[0].content as { gauges: Array<{ value: number }> };
    expect(content.gauges[0].value).toBe(42.5);
  });
});

describe("ported decks use the new types", () => {
  const templates = new Map(loadAllTemplates().map((t) => [t.slug, t]));
  const typeAt = (slug: string, position: number) => templates.get(slug)?.slides[position].type;

  it("switched the legacy mechanics in the templates", () => {
    expect(typeAt("rdv-classique", 14)).toBe("embed");
    expect(typeAt("evergreen", 16)).toBe("showcase");
    expect(typeAt("vsl-funnel", 19)).toBe("screenshots");
    expect(typeAt("tunnel-pay", 22)).toBe("gauge");
    expect(typeAt("tunnel-pay", 13)).toBe("mockup");
    expect(typeAt("pitch-commercial", 35)).toBe("blanks");
  });

  it("links the org screenshots to the migrated legacy assets", () => {
    const manifest: { assets: Array<{ id: string }> } = JSON.parse(
      readFileSync(resolve(process.cwd(), "scripts/seed/getfunnels-org-assets.json"), "utf-8")
    );
    const known = new Set(manifest.assets.map((a) => a.id));
    const shots = loadOrgDecks()
      .flatMap((d) => d.deck.slides)
      .filter((s) => s.type === "screenshots")
      .flatMap((s) => (s.content as { items: Array<{ assetId?: string }> }).items);
    expect(shots.length).toBeGreaterThan(0);
    expect(shots.every((item) => item.assetId && known.has(item.assetId))).toBe(true);
  });
});
