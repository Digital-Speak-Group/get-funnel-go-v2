"use client";

import * as React from "react";
import { ThemeTokensSchema, systemThemes, type ThemeTokens } from "@/lib/slides/theme";
import type { DeckWithRelations } from "@/lib/db/repositories/decks";
import type { SlideWithDeck } from "@/lib/db/repositories/slides";
import type { SystemTheme } from "@/lib/db/repositories/themes";
import { updateDeckAction } from "@/app/(app)/app/decks/actions";
import { cn } from "@/lib/utils";
import { SlideList } from "./SlideList";
import { SlideCanvas } from "./SlideCanvas";
import { SlideFields } from "./SlideFields";
import { LayoutPicker } from "./LayoutPicker";
import { IllustrationPicker } from "./IllustrationPicker";
import { SlideStylePanel } from "./SlideStylePanel";
import { EditorTopBar } from "./EditorTopBar";
import { EditorInspector } from "./EditorInspector";
import { TOPBAR_MESSAGES } from "./messages";
import { useEditorState } from "./useEditorState";
import { useCanvasActions } from "./useCanvasActions";
import { useEditorKeyboard } from "./useEditorKeyboard";

interface EditorShellProps {
  deck: DeckWithRelations;
  initialSlides: SlideWithDeck[];
  themes: SystemTheme[];
}

/** Deck editor: top bar, slide rail, canvas on a neutral stage, inspector (Task 46). */
export function EditorShell({ deck, initialSlides, themes }: EditorShellProps) {
  const editor = useEditorState(deck.id, initialSlides);
  const actions = useCanvasActions(editor);
  const [themeId, setThemeId] = React.useState<string>(deck.themeId);
  const [focused, setFocused] = React.useState(false);
  const { slides, activeId, activeSlide, previewSlide, errors, updateActive } = editor;
  useEditorKeyboard(editor);

  async function selectTheme(slug: string) {
    const row = themes.find((t) => t.tokens.id === slug);
    if (!row || row.id === themeId) return;
    const previous = themeId;
    setThemeId(row.id);
    const res = await updateDeckAction({ id: deck.id, themeId: row.id });
    if ("error" in res) {
      setThemeId(previous);
      editor.setStatus("error");
    }
  }

  const theme = React.useMemo<ThemeTokens>(() => {
    const row = themes.find((t) => t.id === themeId);
    if (row) return row.tokens;
    const parsed = ThemeTokensSchema.safeParse(deck.theme?.tokens);
    return parsed.success ? parsed.data : systemThemes[0];
  }, [themeId, themes, deck.theme]);
  const themeSlug = themes.find((t) => t.id === themeId)?.tokens.id ?? systemThemes[0]?.id ?? "";

  return (
    <div className="space-y-4" data-testid="editor-shell">
      <EditorTopBar
        deck={deck}
        slideCount={slides.length}
        status={editor.status}
        themeSlug={themeSlug}
        themeName={theme.name}
        onTheme={(slug) => void selectTheme(slug)}
        history={editor}
      />

      <div
        className={cn(
          "grid grid-cols-1 items-start gap-4",
          focused ? "lg:grid-cols-[13rem_minmax(0,1fr)]" : "lg:grid-cols-[13rem_minmax(0,1fr)_22rem]"
        )}
      >
        <SlideList
          slides={slides}
          theme={theme}
          activeId={activeId}
          onSelect={editor.selectSlide}
          onMove={(index, direction) => void editor.moveSlide(index, direction)}
          onMoveTo={(from, to) => void editor.moveSlideTo(from, to)}
          onAdd={(type) => void editor.addSlide(type)}
          onDuplicate={(id) => void editor.duplicateSlide(id)}
          onDelete={(id) => void editor.deleteSlide(id)}
        />
        <SlideCanvas
          deckId={deck.id}
          slide={previewSlide}
          onUndo={editor.undo}
          theme={theme}
          onEditText={actions.editText}
          onEditRich={actions.editRich}
          onItemAction={actions.itemAction}
          onSetImage={actions.setImage}
          onFreeChange={actions.setFreeElements}
          onConvertToFree={actions.convertToFree}
          focused={focused}
          onToggleFocus={() => setFocused((f) => !f)}
        />
        <EditorInspector hidden={focused}>
          {activeSlide ? (
            <>
              <LayoutPicker slide={previewSlide ?? activeSlide} theme={theme} onChange={(layout) => updateActive({ layout })} />
              <SlideStylePanel content={activeSlide.content} theme={theme} onChange={(content) => updateActive({ content })} />
              <IllustrationPicker
                value={typeof activeSlide.content.illustration === "string" ? activeSlide.content.illustration : undefined}
                theme={theme}
                onChange={(illustration) => {
                  const { illustration: _previous, ...rest } = activeSlide.content;
                  void _previous;
                  updateActive({ content: illustration ? { ...rest, illustration } : rest });
                }}
              />
              <SlideFields
                slide={activeSlide}
                errors={errors}
                onChange={updateActive}
                // Freeform slides are the user's layout: no AI regeneration (docs/freeform-slides.md).
                onRegenerate={activeSlide.type === "free" ? undefined : (instructions) => void actions.regenerate(instructions)}
                isRegenerating={actions.isRegenerating}
                regenerateError={actions.regenerateError}
              />
            </>
          ) : (
            <p className="text-small text-faint">{TOPBAR_MESSAGES.inspectorEmpty}</p>
          )}
        </EditorInspector>
      </div>
    </div>
  );
}
