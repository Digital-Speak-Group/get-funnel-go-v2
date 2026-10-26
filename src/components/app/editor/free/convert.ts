import {
  CANVAS_WIDTH,
  MAX_FREE_ELEMENTS,
  THEME_ROLES,
  type FreeElement,
  type FreeImage,
  type FreeShape,
  type FreeText,
  type TextStyle,
  type ThemeRole,
} from "@/lib/slides/free";
import type { ThemeTokens } from "@/lib/slides/theme";

/**
 * "Convertir en libre" (Task 68): turns a structured slide, as rendered on the editor canvas,
 * into freeform elements at the same places. It reads the markup the inline-editing layer
 * already puts on every slide — texts (`data-edit-path`), item cards (`data-edit-item`) and
 * images (`data-edit-image`) — so it works for every slide type without per-type code.
 * Static decoration that is not content (icons, connector lines, numbering) is not carried over.
 */

type Rgb = [number, number, number];

export function parseCssColor(value: string): { rgb: Rgb; alpha: number } | null {
  const m = /rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)/.exec(value);
  if (!m) return null;
  const alphaRaw = m[4];
  const alpha = alphaRaw === undefined ? 1 : alphaRaw.endsWith("%") ? parseFloat(alphaRaw) / 100 : parseFloat(alphaRaw);
  return { rgb: [Number(m[1]), Number(m[2]), Number(m[3])], alpha };
}

const hexToRgb = (hex: string): Rgb => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as Rgb;

/** The theme role whose colour is closest to `rgb` (among `roles`). */
export function nearestRole(rgb: Rgb, theme: ThemeTokens, roles: readonly ThemeRole[] = THEME_ROLES): ThemeRole {
  let best: ThemeRole = roles[0];
  let bestDistance = Infinity;
  for (const role of roles) {
    const [r, g, b] = hexToRgb(theme.color[role]);
    const distance = (r - rgb[0]) ** 2 + (g - rgb[1]) ** 2 + (b - rgb[2]) ** 2;
    if (distance < bestDistance) {
      best = role;
      bestDistance = distance;
    }
  }
  return best;
}

/**
 * Text style for a rendered text. The exact size is kept as `size`, so the style mostly
 * decides the font: the theme's display font → title/subtitle, body font → body/caption.
 */
export function styleFor(px: number, usesDisplayFont: boolean): TextStyle {
  if (usesDisplayFont) return px >= 60 ? "title" : "subtitle";
  return px >= 20 ? "body" : "caption";
}

const firstFamily = (family: string) => family.split(",")[0].trim().replace(/^['"]|['"]$/g, "").toLowerCase();

const TEXT_ROLES: ThemeRole[] = ["text", "muted", "primary", "accent", "danger", "success"];

function getAtPath(content: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>(
    (node, key) => (node && typeof node === "object" ? (node as Record<string, unknown>)[key] : undefined),
    content
  );
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Freeform elements for the slide rendered in `slideRoot` (the 1920×1080 slide element,
 * possibly CSS-scaled). Paint order: cards, then images, then texts on top; past the
 * 60-element limit the smallest cards are dropped first.
 */
export function convertRenderedSlide(slideRoot: HTMLElement, content: Record<string, unknown>, theme: ThemeTokens): FreeElement[] {
  const rootRect = slideRoot.getBoundingClientRect();
  const scale = rootRect.width / CANVAS_WIDTH || 1;
  const boxOf = (el: Element): Box => {
    const r = el.getBoundingClientRect();
    return {
      x: Math.round((r.left - rootRect.left) / scale),
      y: Math.round((r.top - rootRect.top) / scale),
      w: Math.max(8, Math.round(r.width / scale)),
      h: Math.max(8, Math.round(r.height / scale)),
    };
  };

  const cards: FreeShape[] = [];
  for (const el of slideRoot.querySelectorAll<HTMLElement>("[data-edit-item]")) {
    const style = getComputedStyle(el);
    const fill = parseCssColor(style.backgroundColor);
    if (!fill || fill.alpha < 0.05) continue; // plain list rows: nothing to draw
    cards.push({
      id: crypto.randomUUID(),
      kind: "shape",
      shape: "rect",
      ...boxOf(el),
      fill: nearestRole(fill.rgb, theme, ["surface", "bg", "primary", "accent", "muted", "danger", "success"]),
      radius: Math.min(540, Math.round(parseFloat(style.borderTopLeftRadius) || 0)),
    });
  }

  const images: FreeImage[] = [];
  for (const overlay of slideRoot.querySelectorAll<HTMLElement>("[data-edit-image]")) {
    const area = overlay.parentElement;
    if (!area) continue;
    const assetId = getAtPath(content, overlay.dataset.editImage!);
    const img = area.querySelector("img");
    images.push({
      id: crypto.randomUUID(),
      kind: "image",
      ...boxOf(area),
      ...(typeof assetId === "string" ? { assetId } : {}),
      fit: img && getComputedStyle(img).objectFit === "cover" ? "cover" : "contain",
    });
  }

  const texts: FreeText[] = [];
  for (const el of slideRoot.querySelectorAll<HTMLElement>("[data-edit-path]")) {
    const text = (el.innerText ?? el.textContent ?? "").trim().slice(0, 600);
    if (!text) continue; // empty optional field shown as a placeholder
    const style = getComputedStyle(el);
    const size = Math.round(parseFloat(style.fontSize) || 26);
    const color = parseCssColor(style.color);
    // Gradient headlines paint their text transparent: fall back to the text colour.
    const role = color && color.alpha > 0.05 ? nearestRole(color.rgb, theme, TEXT_ROLES) : "text";
    const align = style.textAlign === "center" || style.textAlign === "right" ? style.textAlign : "left";
    const textStyle = styleFor(size, firstFamily(style.fontFamily) === firstFamily(theme.font.display));
    const weight = Number(style.fontWeight) || 400;
    const display = textStyle === "title" || textStyle === "subtitle";
    // Styles carry a default weight (display 700–800, body 400–500): note only the difference.
    const weightOverride = !display && weight >= 600 ? "bold" : display && weight < 600 ? "regular" : undefined;
    texts.push({
      id: crypto.randomUUID(),
      kind: "text",
      text,
      style: textStyle,
      size: Math.min(200, Math.max(10, size)),
      ...boxOf(el),
      ...(align !== "left" ? { align } : {}),
      color: role,
      ...(weightOverride ? { weight: weightOverride } : {}),
    });
  }

  const room = MAX_FREE_ELEMENTS - images.length - texts.length;
  const keptCards = room >= cards.length ? cards : [...cards].sort((a, b) => b.w * b.h - a.w * a.h).slice(0, Math.max(0, room));
  return [...keptCards, ...images, ...texts].slice(0, MAX_FREE_ELEMENTS);
}
