# Design System

> Read before any UI work. Two token layers exist: **product chrome** (the SaaS app) and **deck themes** (the presentations users generate). They are separate systems that share primitives.

## Two Token Layers

| Layer | Scope | Source | Consumed by |
|---|---|---|---|
| Product tokens | App shell: nav, dashboard, editor, billing | `src/styles/globals.css` (`@theme` in Tailwind v4) | Everything except slide rendering |
| Deck themes | A single presentation's look | `themes.tokens` JSON, schema in `docs/ai-generation.md` | `src/components/slides/**` only |

Rule: slide components read **only** theme tokens (via CSS variables set on a slide root element). App components read **only** product tokens. Never mix.

## Visual Direction — Refined Dark

Premium means restraint. The register is Linear / Vercel: near-black neutrals, hairline borders, and dense but calm typography.

- **Depth comes from surface steps** (`background` → `surface` → `surface-2` → `surface-3`), not from glows, blur blobs, or heavy shadows.
- **Violet is reserved** for primary actions, focus rings, and selection. Everything else is neutral. A screen with more than one violet button is wrong.
- **No gradient text, no decorative blur blobs, no fake window chrome, no `animate-pulse` ornaments.** Show the real product (rendered slides) instead of illustrations of it.
- **Hairlines over boxes.** Prefer a 1 px `border` divider or whitespace over nesting cards in cards.
- **One primary action per view**, top right in the `PageHeader`.

## Product Tokens

Raw values live on `:root` in `src/styles/globals.css`, mapped to Tailwind utilities with `@theme inline`. Non-CSS consumers (viewport metadata, OG images) import `productTokens` from `src/lib/design/tokens.ts`; a unit test keeps both in sync and enforces contrast.

| Token | Value | Tailwind | Use |
|---|---|---|---|
| `--bg` | `#0a0a0b` | `bg-background` | Page |
| `--surface` | `#111113` | `bg-surface`, `bg-card` | Cards, sidebar, panels |
| `--surface-2` | `#18181b` | `bg-surface-2`, `bg-muted`, `bg-popover`, `bg-secondary` | Raised: popovers, inputs, secondary buttons |
| `--surface-3` | `#1f1f23` | `bg-surface-3`, `bg-accent` | Hover and selected rows |
| `--border` | white / 7 % | `border-border` (default) | Hairlines |
| `--border-strong` | white / 12 % | `border-border-strong` | Inputs, emphasized edges |
| `--fg` | `#ededef` | `text-foreground` | Primary text |
| `--fg-muted` | `#a1a1aa` | `text-muted-foreground` | Secondary text |
| `--fg-faint` | `#85858e` | `text-faint` | Metadata, placeholders (≥ 4.5:1 on surfaces) |
| `--primary` | `#6e56cf` | `bg-primary` | Primary action |
| `--primary-hover` | `#765dd3` | `bg-primary-hover` | Primary hover |
| `--brand` | `#baa7ff` | `text-brand` | Violet text: links, active nav icon |
| `--ring` | `#7d66d9` | `ring-ring` | Focus rings |
| `--success` / `--warning` / `--danger` | `#3dd68c` / `#ffc53d` / `#ff6369` | `text-success` … | Status text and dots |
| `--destructive` | `#ce2c31` | `bg-destructive` | Destructive buttons |

shadcn/ui semantic names (`card`, `popover`, `secondary`, `accent`, `muted`, `destructive`, `input`, `ring`, `*-foreground`) are aliases of the tokens above, so primitives are themed **without editing their source**. Note `accent` follows shadcn semantics (neutral hover surface); violet text is `brand`.

| Scale | Values |
|---|---|
| Radius | `sm` 6 px · `md` 8 px (controls) · `lg` 12 px (cards) · `xl` 16 px (dialogs) · `2xl` 20 px |
| Shadow | `shadow-card` (barely there) · `shadow-pop` (popovers, dialogs: 1 px edge + soft drop) · `shadow-highlight` (inset top light on primary buttons) |
| Motion | `--duration-fast` 150 ms · `--duration-base` 250 ms · `--duration-slow` 450 ms · `--ease-out` |

Brand note: chrome uses the tuned violet `#6e56cf` because the legacy `#470C85` reaches only ~1.6:1 against near-black (invisible as a button edge or focus ring). **Deck themes keep `#470C85` and `#8b5cf6` unchanged** so ported decks look identical.

Dark-first: the product ships dark. Light mode is deferred (spec Q3); when it lands it is a `[data-theme="light"]` block overriding the `:root` values — no component changes.

Guardrail: `tests/unit/design-guardrail.test.ts` fails on raw palette classes (`zinc-800`, `text-white`, …), hex values, arbitrary color values, and `rgb()`/`hsl()` literals in `src/app` and `src/components` (slides exempt). Its `MIGRATING` list shrinks to empty by the end of Phase 5.

## Typography Scale

Font: **Geist** (UI, display) and **Geist Mono** (timers, numbers, shortcuts), loaded with `next/font` in `src/app/layout.tsx`.

| Role | Tailwind | Size / line-height | Weight / tracking | Use |
|---|---|---|---|---|
| Display | `text-display` | 56 px / 1.05 | 600 / −0.035em | Marketing hero only (scale down on mobile) |
| H1 | `text-h1` | 24 px / 1.25 | 600 / −0.02em | Page titles |
| H2 | `text-h2` | 18 px / 1.35 | 600 / −0.01em | Section titles |
| H3 | `text-h3` | 15 px / 1.4 | 500 | Card titles |
| Body | `text-body` | 14 px / 1.55 | 400 | App copy (default) |
| Small | `text-small` | 13 px / 1.5 | 400 | Metadata |
| Label | `text-label-caps` | 11 px / 1.4 | 600 / +0.08em, uppercase | Kickers, section labels |

Numbers that change (timers, credits, counts) use `font-mono tabular-nums`.

Slide text uses the deck theme's `font.scale`: `compact` (denser, more content), `regular`, `editorial` (larger, fewer words). Slide components must never hardcode px sizes outside this scale map.

## Slide Layout System

- Design space: **1920 × 1080** fixed; the renderer scales with `transform: scale(min(vw/1920, vh/1080))` and centers. One layout, every screen.
- Safe margins: 96 px sides, 72 px top/bottom. Content never touches edges.
- Grid: 12 columns, 24 px gutters.
- Max content per slide: enforced by the schema character limits, not by CSS clamping. If it overflows in review, fix the content limits, not the layout.
- Backgrounds: `solid | grid | gradient | noise` from the theme — implemented as one background component, not per-slide.
- Slide chrome (page number, logo, progress) is app-controlled, not part of slide content.

### Signature kit (Phase 6, Task 58)

The legacy deck look, rebuilt as optional theme tokens (`theme.style`, absent = flat look):

| Token | Values | Effect |
|---|---|---|
| `style.decor` | `none \| glow \| signature` | `SlideDecor` behind content: primary/accent glows; `signature` adds a faint grid fading to the edges and pill kickers |
| `style.surface` | `flat \| glass` | Cards via `cardSurface()`: theme surface, or translucent fill + 16 px backdrop blur + soft primary shadow |
| `style.headline` | `solid \| gradient` | `h1` via `headlineFill()`: given color, or text→70 % text gradient clip |

- Six system themes (`src/lib/slides/signature-themes.ts`) carry the legacy per-funnel accents; legacy templates point at the matching one.
- `--slide-primary-text` is the brand color for **text**: primary when it reaches 4.5:1 on the canvas, else accent, else text. Deep primaries like `#470C85` stay fills only.
- Slide components use the helpers in `src/components/slides/style.ts`, never raw `--slide-surface`/primary for cards, headlines or labels.
- Review renders at `/dev/slides?template=<slug>&theme=<id>&slides=0,3` (dev only).

## Motion

| Interaction | Duration | Easing |
|---|---|---|
| Slide transition | 450 ms | `--ease-out` |
| Element entrance (stagger 40 ms) | 250 ms | `--ease-out` |
| Hover / press | 150 ms | ease |
| Modal / sheet | 250 ms | `--ease-out` |

Rules: motion honors `prefers-reduced-motion` (fall back to opacity only); presenter view is animation-free (speed matters); audience view animates. The only infinite animations allowed inside slides are the Signature decor's slow 12 s glow "breathing" and slide illustrations (below), and only on the live audience slide (`isActive`) with theme motion ≠ `none` — never in thumbnails, the editor or the presenter, and disabled under reduced motion. Slide illustrations (Task 61, `src/components/slides/illustrations/`, picked per slide in the editor) follow the same rule: drawn in the deck theme's primary/accent/muted, still everywhere except the live audience slide with theme motion ≠ `none`, and stopped by `prefers-reduced-motion`. They sit behind the content in the bottom-right corner at 55 % opacity and never carry information. Live slides also get a staggered entrance (`[data-slide-reveal="on"]` in `globals.css`, 600 ms, `[0.22, 1, 0.36, 1]`).

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
| Use tokens for every color, radius, shadow | Hardcode `#470C85`, `zinc-800`, `text-white`, or arbitrary `rgba()` in components |
| Show real rendered slides in marketing and auth | Glow blobs, gradient text, fake window chrome |
| Neutral chrome, violet only for the primary action | Several violet buttons competing on one screen |
| Compose shadcn primitives | Fork `src/components/ui/*` |
| One background component per theme mode | Per-slide background hacks |
| Test on 1440×900 and mobile for app screens | Assume desktop only for dashboard/editor |
| Keep audience view chrome-free | Add controls visible to the audience |
| French-first microcopy | English placeholders shipped to users |
