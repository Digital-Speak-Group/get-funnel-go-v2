"use client";

import * as React from "react";

/**
 * Inline editing on the editor canvas. Slide components render their content strings
 * through `EditableText`: everywhere else (audience, presenter, thumbnails, PDF/PPTX) it is
 * the plain element with the plain text; under `SlideEditProvider` it becomes a
 * `contentEditable` field that writes the new string back to its content path
 * (`painPoints.0.title`, see `setContentPath`).
 */

interface SlideEditApi {
  onEdit: (path: string, value: string) => void;
  /** Hint shown in an empty field (optional text the slide does not use yet). */
  placeholderFor: (path: string) => string;
}

const SlideEditContext = React.createContext<SlideEditApi | null>(null);

export function SlideEditProvider({ children, ...api }: SlideEditApi & { children: React.ReactNode }) {
  const { onEdit, placeholderFor } = api;
  const value = React.useMemo(() => ({ onEdit, placeholderFor }), [onEdit, placeholderFor]);
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
