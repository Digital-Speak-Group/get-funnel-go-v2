"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Copy, ImagePlus, Trash2 } from "lucide-react";

/**
 * Inline editing on the editor canvas. Slide components render their content strings
 * through `EditableText`: everywhere else (audience, presenter, thumbnails, PDF/PPTX) it is
 * the plain element with the plain text; under `SlideEditProvider` it becomes a
 * `contentEditable` field that writes the new string back to its content path
 * (`painPoints.0.title`, see `setContentPath`).
 */

export type ItemAction = "before" | "after" | "duplicate" | "remove";

/** Item toolbar on repeated parts (pain points, steps…), see `EditableItem`. */
export interface SlideItemApi {
  /** Whether `action` is allowed on item `index` of the list at `path` (schema min/max, ends). */
  can: (path: string, action: ItemAction, index: number, length: number) => boolean;
  act: (path: string, action: ItemAction, index: number) => void;
  label: (action: ItemAction) => string;
}

/** Image picker on the canvas, see `EditableImage`. `path` is the `assetId` content path. */
export interface SlideImageApi {
  pick: (path: string) => void;
  remove: (path: string) => void;
  label: (action: "add" | "replace" | "remove") => string;
}

interface SlideEditApi {
  onEdit: (path: string, value: string) => void;
  /** Hint shown in an empty field (optional text the slide does not use yet). */
  placeholderFor: (path: string) => string;
  items?: SlideItemApi;
  images?: SlideImageApi;
}

const SlideEditContext = React.createContext<SlideEditApi | null>(null);

export function SlideEditProvider({ children, ...api }: SlideEditApi & { children: React.ReactNode }) {
  const { onEdit, placeholderFor, items, images } = api;
  const value = React.useMemo(
    () => ({ onEdit, placeholderFor, items, images }),
    [onEdit, placeholderFor, items, images]
  );
  return <SlideEditContext.Provider value={value}>{children}</SlideEditContext.Provider>;
}

export function useSlideEditing(): boolean {
  return React.useContext(SlideEditContext) !== null;
}

type TextTag = "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div" | "li" | "strong" | "em" | "small" | "blockquote" | "figcaption" | "cite";

interface EditableTextProps extends Omit<React.HTMLAttributes<HTMLElement>, "children" | "placeholder"> {
  /** Content path of the string, e.g. `headline` or `steps.2.title`. */
  path: string;
  value: string | undefined | null;
  as?: TextTag;
  /** Keeps line breaks (Enter inserts one); single-line fields end editing on Enter. */
  multiline?: boolean;
}

/** `innerText` keeps the line breaks the browser renders as `<br>`; jsdom only has `textContent`. */
function readText(el: HTMLElement): string {
  const text = typeof el.innerText === "string" ? el.innerText : (el.textContent ?? "");
  return text.replace(/\n$/, "");
}

export function EditableText({ path, value, as = "span", multiline = false, ...rest }: EditableTextProps) {
  const api = React.useContext(SlideEditContext);
  const text = value ?? "";

  if (!api) {
    // Empty optional text renders nothing, exactly like the `{x && <p>{x}</p>}` it replaces.
    if (!text) return null;
    return React.createElement(as, rest, text);
  }
  return <EditableField api={api} path={path} text={text} as={as} multiline={multiline} {...rest} />;
}

function EditableField({
  api,
  path,
  text,
  as,
  multiline,
  style,
  ...rest
}: Omit<EditableTextProps, "value"> & { api: SlideEditApi; text: string; as: TextTag }) {
  const ref = React.useRef<HTMLElement>(null);

  // Uncontrolled while focused: re-rendering the text node would move the caret.
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el || el === document.activeElement || readText(el) === text) return;
    el.textContent = text;
  }, [text]);

  return React.createElement(as, {
    ...rest,
    ref,
    // Gradient headlines paint the text transparent: keep the caret visible.
    style: { ...style, caretColor: "var(--slide-text)", cursor: "text" },
    contentEditable: "plaintext-only",
    suppressContentEditableWarning: true,
    // Headings keep their role (a textbox role is not allowed on them) and take a label;
    // other elements become a labelled textbox (a label alone is not allowed on them).
    ...(/^h\d$/.test(as) ? {} : { role: "textbox", "aria-multiline": multiline || undefined }),
    "aria-label": api.placeholderFor(path),
    "data-edit-path": path,
    "data-placeholder": api.placeholderFor(path),
    onInput: (event: React.FormEvent<HTMLElement>) => api.onEdit(path, readText(event.currentTarget)),
    // Text can sit inside a <button>, <summary> or form (FAQ, capture, screenshots): a click
    // meant to place the caret must not also toggle, submit or open the slide's own UI.
    onClick: (event: React.MouseEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();
    },
    onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.key === "Escape" || (event.key === "Enter" && !multiline)) {
        event.preventDefault();
        event.currentTarget.blur();
      }
    },
  });
}

type ItemTag = "div" | "li" | "article" | "section" | "figure" | "span";

interface EditableItemProps extends React.HTMLAttributes<HTMLElement> {
  /** Content path of the list (`painPoints`, `layers.1.items`). */
  path: string;
  index: number;
  /** Current length of the list (to disable moves at the ends and keep schema limits). */
  length: number;
  as?: ItemTag;
}

const ITEM_ACTIONS: { action: ItemAction; Icon: typeof Copy }[] = [
  { action: "before", Icon: ChevronLeft },
  { action: "after", Icon: ChevronRight },
  { action: "duplicate", Icon: Copy },
  { action: "remove", Icon: Trash2 },
];

/**
 * Root element of one repeated item. Outside the editor it is the plain element; on the
 * editor canvas it also carries a hover toolbar to move, duplicate or delete the item.
 */
export function EditableItem({ path, index, length, as = "div", style, children, ...rest }: EditableItemProps) {
  const items = React.useContext(SlideEditContext)?.items;
  if (!items) return React.createElement(as, { ...rest, style }, children);

  return React.createElement(
    as,
    {
      ...rest,
      // The toolbar is positioned against the item; items already positioned keep theirs.
      style: { position: "relative", ...style },
      "data-edit-item": `${path}.${index}`,
    },
    children,
    <span data-item-toolbar="" key="gf-item-toolbar" contentEditable={false}>
      {ITEM_ACTIONS.map(({ action, Icon }) => (
        <button
          key={action}
          type="button"
          aria-label={items.label(action)}
          title={items.label(action)}
          disabled={!items.can(path, action, index, length)}
          data-item-action={action}
          // Keep the click (and the caret of a text being edited) inside the toolbar.
          onMouseDown={(event) => event.preventDefault()}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            items.act(path, action, index);
          }}
        >
          <Icon aria-hidden="true" />
        </button>
      ))}
    </span>
  );
}

/**
 * Image controls over an image area (the area must be positioned). Renders nothing outside
 * the editor; on the canvas it covers the area with "add" or "replace / remove" buttons.
 */
export function EditableImage({ path, hasImage }: { path: string; hasImage: boolean }) {
  const images = React.useContext(SlideEditContext)?.images;
  if (!images) return null;

  const stop = (event: React.SyntheticEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };
  return (
    <span data-edit-image={path} data-has-image={hasImage ? "" : undefined}>
      <button
        type="button"
        onMouseDown={stop}
        onClick={(event) => {
          stop(event);
          images.pick(path);
        }}
      >
        <ImagePlus aria-hidden="true" />
        {images.label(hasImage ? "replace" : "add")}
      </button>
      {hasImage && (
        <button
          type="button"
          aria-label={images.label("remove")}
          title={images.label("remove")}
          onMouseDown={stop}
          onClick={(event) => {
            stop(event);
            images.remove(path);
          }}
        >
          <Trash2 aria-hidden="true" />
        </button>
      )}
    </span>
  );
}
