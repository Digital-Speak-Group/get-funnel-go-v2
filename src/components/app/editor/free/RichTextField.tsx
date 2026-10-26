"use client";

import * as React from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { RichTextEditorProps } from "@/components/slides/editable";
import { isSafeHref } from "@/lib/slides/rich-text";
import { richToTiptap, tiptapToRich } from "./rich-convert";
import { RichTextChangeContext, registerRichEditor } from "./rich-editors";

/** Only what the stored format holds (rich-text.ts): paragraphs, lists, bold/italic/underline/link. */
const extensions = [
  StarterKit.configure({
    heading: false,
    blockquote: false,
    code: false,
    codeBlock: false,
    horizontalRule: false,
    strike: false,
    dropcursor: false,
    gapcursor: false,
    link: {
      openOnClick: false,
      autolink: true,
      protocols: ["http", "https", "mailto"],
      isAllowedUri: (url) => isSafeHref(url),
    },
  }),
];

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * A freeform text on the editor canvas (Task 76): a TipTap field, typed in after a
 * double-click (FreeEditor focuses its contenteditable). Escape ends typing. Changes go to the
 * editor through RichTextChangeContext; TipTap keeps its own undo while typing.
 */
export function RichTextField({ path, value, placeholder, style }: RichTextEditorProps) {
  const onChange = React.useContext(RichTextChangeContext);
  const latest = React.useRef({ onChange, path });
  latest.current = { onChange, path };
  const [empty, setEmpty] = React.useState(false);

  const editor = useEditor({
    extensions,
    content: richToTiptap(value),
    immediatelyRender: false,
    editorProps: {
      attributes: { role: "textbox", "aria-multiline": "true", "aria-label": placeholder, "data-edit-path": `${path}.text` },
      handleKeyDown: (view, event) => {
        if (event.key !== "Escape") return false;
        (view.dom as HTMLElement).blur();
        return true;
      },
    },
    onCreate: ({ editor: e }) => setEmpty(e.isEmpty),
    onUpdate: ({ editor: e }) => {
      setEmpty(e.isEmpty);
      latest.current.onChange?.(latest.current.path, tiptapToRich(e.getJSON()));
    },
  });

  React.useEffect(() => (editor ? registerRichEditor(path, editor) : undefined), [editor, path]);

  // Outside changes (undo, the toolbar on a text not being typed in): take them in, but never
  // while the user types — resetting the content would move the caret.
  React.useEffect(() => {
    if (!editor || editor.isFocused || same(tiptapToRich(editor.getJSON()), value)) return;
    editor.commands.setContent(richToTiptap(value), { emitUpdate: false });
    setEmpty(editor.isEmpty);
  }, [editor, value]);

  return (
    <EditorContent
      editor={editor}
      style={style}
      data-free-rich=""
      data-empty={empty || undefined}
      data-placeholder={placeholder}
    />
  );
}
