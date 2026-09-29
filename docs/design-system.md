# Design System

> Read before any UI work. Two token layers exist: **product chrome** (the SaaS app) and **deck themes** (the presentations users generate). They are separate systems that share primitives.

## Two Token Layers

| Layer | Scope | Source | Consumed by |
|---|---|---|---|
| Product tokens | App shell: nav, dashboard, editor, billing | `src/styles/globals.css` (`@theme` in Tailwind v4) | Everything except slide rendering |
| Deck themes | A single presentation's look | `themes.tokens` JSON, schema in `docs/ai-generation.md` | `src/components/slides/**` only |

Rule: slide components read **only** theme tokens (via CSS variables set on a slide root element). App components read **only** product tokens. Never mix.

## Product Tokens

```css
@theme {
  --color-bg: #09090b;
  --color-surface: #111118;
  --color-surface-2: #17171f;
  --color-border: rgb(255 255 255 / 0.08);
  --color-text: #fafafa;
  --color-text-muted: #a1a1aa;
  --color-text-faint: #52525b;

  --color-primary: #470c85;
  --color-primary-hover: #5b16a3;
  --color-primary-fg: #ffffff;
  --color-accent: #8b5cf6;
  --color-success: #34d399;
  --color-warning: #fbbf24;
  --color-danger: #f87171;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;

  --font-display: "Inter", system-ui, sans-serif;
  --font-body: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", monospace;

  --shadow-card: 0 1px 2px rgb(0 0 0 / 0.4), 0 8px 24px rgb(0 0 0 / 0.35);
  --shadow-pop: 0 0 60px rgb(139 92 246 / 0.15), 0 30px 80px rgb(0 0 0 / 0.6);

  --duration-fast: 150ms;
  --duration-base: 250ms;
  --duration-slow: 450ms;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}
```

Legacy palette note: `#470C85` (primary) and `#8b5cf6` (accent) come from the existing brand — keep them as defaults so ported decks look identical.

Dark-first: the product ships dark by default (matching the legacy app). A light mode is required before public launch; both are driven by the same token names via a `[data-theme="light"]` override block.

## Typography Scale

| Role | Size / line-height | Weight | Use |
|---|---|---|---|
| Display | 56–96 px / 1.05 | 800 | Slide headlines, marketing hero |
| H1 | 36 px / 1.15 | 700 | Page titles |
| H2 | 24 px / 1.25 | 700 | Section titles, slide headlines |
| H3 | 18 px / 1.35 | 600 | Card titles |
| Body | 15 px / 1.55 | 400 | App copy |
| Small | 13 px / 1.5 | 400 | Metadata |
| Label | 11 px / 1.4 | 600, tracking +0.08em, uppercase | Kickers, eyebrows |

Slide text uses the deck theme's `font.scale`: `compact` (denser, more content), `regular`, `editorial` (larger, fewer words). Slide components must never hardcode px sizes outside this scale map.

## Slide Layout System

- Design space: **1920 × 1080** fixed; the renderer scales with `transform: scale(min(vw/1920, vh/1080))` and centers. One layout, every screen.
- Safe margins: 96 px sides, 72 px top/bottom. Content never touches edges.
- Grid: 12 columns, 24 px gutters.
- Max content per slide: enforced by the schema character limits, not by CSS clamping. If it overflows in review, fix the content limits, not the layout.
- Backgrounds: `solid | grid | gradient | noise` from the theme — implemented as one background component, not per-slide.
- Slide chrome (page number, logo, progress) is app-controlled, not part of slide content.

## Motion

| Interaction | Duration | Easing |
|---|---|---|
| Slide transition | 450 ms | `--ease-out` |
| Element entrance (stagger 40 ms) | 250 ms | `--ease-out` |
| Hover / press | 150 ms | ease |
| Modal / sheet | 250 ms | `--ease-out` |

Rules: motion honors `prefers-reduced-motion` (fall back to opacity only); no infinite decorative animations inside slides; presenter view is animation-free (speed matters); audience view animates.

## Component Conventions

- shadcn/ui primitives live in `src/components/ui` and are **not forked** — compose around them.
- Every reusable component: typed props, no `any`, `className` passthrough via `cn()`.
- Variants via `cva`, not conditional string concatenation.
- No inline `style` except computed values (theme variables, transforms).
- No hex colors in components — tokens only. A lint rule or review check enforces this.
- File per component, named export; screens compose, components render.

## Surfaces to Design (V1)

| Surface | Route | Requirements |
|---|---|---|
| Marketing landing | `/` | Hero with value prop, live deck preview, template gallery, pricing teaser, CTA. SEO + OG images. |
| Pricing | `/pricing` | 3 plans, credit explanation, FAQ, Stripe checkout buttons |
| Auth | `/login`, `/signup` | Email/password + magic link, inline validation, French copy |
| Onboarding | `/onboarding` | Org name, brand color picker, first template choice; ≤ 3 steps |
| Dashboard | `/app` | Deck grid with thumbnails, search, sort, empty state with "generate your first deck" |
| Template gallery | `/app/templates` | Category filter (Diagnostic / Conversion / Lancement), preview modal, "use template" |
| Generation wizard | `/app/new` | Paste script, choose template, theme, length, tone; progress with stage labels; preview before save |
| Deck editor | `/app/decks/[id]` | Slide list + canvas, inline text editing, reorder, add/remove/duplicate, per-slide regenerate, theme switch, version history |
| Presenter view | `/app/decks/[id]/present` | Slide + next slide, script/notes/metrics tabs, timer, keyboard-only operation |
| Audience view | `/p/[token]` | Full-bleed slide, animated transitions, no chrome, works on any device |
| Settings | `/app/settings/*` | Profile, organization + members, themes, billing, usage/credits |
| Billing | `/app/settings/billing` | Current plan, usage meter, invoices, upgrade/downgrade |

Presenter/audience are the differentiators: they get the most design attention. The audience view must look like a finished product with zero visible controls.

## Accessibility

- Contrast ≥ 4.5:1 for body text, ≥ 3:1 for large text, in both product and every shipped deck theme.
- Full keyboard operation in presenter view (arrows, space, `F` fullscreen, `P` presenter).
- Focus rings always visible in app chrome; hidden in audience view only.
- All interactive elements have accessible names; slides expose `aria-label` with slide title.
- Respect `prefers-reduced-motion` and `prefers-color-scheme` (product light/dark).

## Do / Don't

| Do | Don't |
|---|---|
| Use tokens for every color, radius, shadow | Hardcode `#470C85` or arbitrary `rgba()` in components |
| Compose shadcn primitives | Fork `src/components/ui/*` |
| One background component per theme mode | Per-slide background hacks |
| Test on 1440×900 and mobile for app screens | Assume desktop only for dashboard/editor |
| Keep audience view chrome-free | Add controls visible to the audience |
| French-first microcopy | English placeholders shipped to users |
