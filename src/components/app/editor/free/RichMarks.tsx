"use client";

import * as React from "react";
import { Bold, Italic, Link2, List, ListOrdered, Underline } from "lucide-react";
import type { ChainedCommands } from "@tiptap/core";
import { useEditorState } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { isSafeHref } from "@/lib/slides/rich-text";
import { cn } from "@/lib/utils";
import { FREE_MESSAGES } from "../messages";
import { inputClass } from "../fields/field-ui";
import { useRichEditor } from "./rich-editors";

const m = FREE_MESSAGES.marks;
/** Toolbar buttons must not take the focus from the text being typed in. */
const keep = (event: React.MouseEvent) => event.preventDefault();

type RichEditor = NonNullable<ReturnType<typeof useRichEditor>>;

/**
 * Formatting of the selected freeform text (Task 76): on the selected words while typing,
 * on the whole text otherwise. Lists turn paragraphs into bullet or numbered items.
 */
export function RichMarks({ path }: { path: string }) {
  const editor = useRichEditor(path);
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e && {
        focused: e.isFocused,
        bold: e.isActive("bold"),
        italic: e.isActive("italic"),
        underline: e.isActive("underline"),
        link: e.isActive("link"),
        bullet: e.isActive("bulletList"),
        ordered: e.isActive("orderedList"),
      },
  });
  if (!editor || !state) return null;

  const run = (fn: (chain: ChainedCommands) => ChainedCommands) => {
    const chain = state.focused ? editor.chain().focus() : editor.chain().selectAll();
    fn(chain).run();
  };
  const toggle = (label: string, active: boolean, Icon: typeof Bold, fn: (chain: ChainedCommands) => ChainedCommands, testId: string) => (
    <Button
      type="button"
      size="icon-sm"
      variant="ghost"
      aria-label={label}
      title={label}
      aria-pressed={active}
      data-testid={testId}
      className={cn(active && "bg-surface-3 text-foreground")}
      onMouseDown={keep}
      onClick={() => run(fn)}
    >
      <Icon aria-hidden="true" />
    </Button>
  );

  return (
    <>
      {toggle(m.bold, state.bold, Bold, (c) => c.toggleBold(), "free-mark-bold")}
      {toggle(m.italic, state.italic, Italic, (c) => c.toggleItalic(), "free-mark-italic")}
      {toggle(m.underline, state.underline, Underline, (c) => c.toggleUnderline(), "free-mark-underline")}
      <LinkButton editor={editor} active={state.link} />
      {toggle(m.bullet, state.bullet, List, (c) => c.toggleBulletList(), "free-mark-bullet")}
      {toggle(m.ordered, state.ordered, ListOrdered, (c) => c.toggleOrderedList(), "free-mark-ordered")}
    </>
  );
}

function LinkButton({ editor, active }: { editor: RichEditor; active: boolean }) {
  const [open, setOpen] = React.useState(false);
  const [href, setHref] = React.useState("");
  const [error, setError] = React.useState(false);
  // The words to link, remembered when the popover opens (its input then takes the focus).
  const range = React.useRef<{ from: number; to: number } | null>(null);

  function onOpenChange(next: boolean) {
    if (next) {
      const { from, to } = editor.state.selection;
      range.current = editor.isFocused && from !== to ? { from, to } : null;
      setHref((editor.getAttributes("link").href as string | undefined) ?? "");
      setError(false);
    }
    setOpen(next);
  }

  const target = () => (range.current ? editor.chain().setTextSelection(range.current) : editor.chain().selectAll());

  function apply(event: React.FormEvent) {
    event.preventDefault();
    const value = href.trim();
    if (!isSafeHref(value)) return setError(true);
    target().extendMarkRange("link").setLink({ href: value }).run();
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label={m.link}
          title={m.link}
          aria-pressed={active}
          data-testid="free-mark-link"
          className={cn(active && "bg-surface-3 text-foreground")}
          onMouseDown={keep}
        >
          <Link2 aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-3">
        <form onSubmit={apply} className="space-y-2">
          <label htmlFor="free-link-href" className="text-small font-medium text-foreground">
            {m.linkLabel}
          </label>
          <input
            id="free-link-href"
            type="url"
            value={href}
            placeholder={m.linkPlaceholder}
            onChange={(e) => setHref(e.target.value)}
            className={inputClass(error)}
            aria-invalid={error || undefined}
            data-testid="free-link-href"
          />
          {error && <p className="text-xs text-danger">{m.linkInvalid}</p>}
          <div className="flex justify-between gap-2">
            {active ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  target().extendMarkRange("link").unsetLink().run();
                  setOpen(false);
                }}
              >
                {m.linkRemove}
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" size="sm" data-testid="free-link-apply">
              {m.linkApply}
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
