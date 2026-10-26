"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  CreditCard,
  FileText,
  LayoutGrid,
  LayoutTemplate,
  Sparkles,
  User,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { listDecksAction } from "@/app/(app)/app/decks/actions";
import { shellMessages as m } from "./messages";

interface DeckEntry {
  id: string;
  title: string;
}

const MAX_DECKS = 30;

const actions = [
  { label: m.command.newDeck, href: "/app/new", icon: Sparkles },
  { label: m.command.browseTemplates, href: "/app/templates", icon: LayoutTemplate },
];

const pages = [
  { label: m.command.dashboard, href: "/app", icon: LayoutGrid },
  { label: m.command.profile, href: "/app/settings/profile", icon: User },
  { label: m.command.organization, href: "/app/settings/organization", icon: Building2 },
  { label: m.command.billing, href: "/app/settings/billing", icon: CreditCard },
];

interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** ⌘K / Ctrl+K palette: actions, navigation, and jump-to-deck. */
export function CommandMenu({ open, onOpenChange }: CommandMenuProps) {
  const router = useRouter();
  const [decks, setDecks] = React.useState<DeckEntry[] | null>(null);

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        onOpenChange(!open);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  // Load decks each time the palette opens so titles stay fresh.
  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    listDecksAction({}).then((result) => {
      if (cancelled) return;
      setDecks((result.decks ?? []).slice(0, MAX_DECKS).map(({ id, title }) => ({ id, title })));
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title={m.command.title} description={m.command.description}>
      <CommandInput placeholder={m.command.placeholder} />
      <CommandList>
        <CommandEmpty>{m.command.empty}</CommandEmpty>
        <CommandGroup heading={m.command.actions}>
          {actions.map((item) => (
            <CommandItem key={item.href} value={item.label} onSelect={() => go(item.href)}>
              <item.icon aria-hidden="true" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
        {(decks === null || decks.length > 0) && (
          <>
            <CommandSeparator />
            <CommandGroup heading={m.command.decks}>
              {decks === null ? (
                <CommandItem disabled value="__loading">
                  {m.command.loading}
                </CommandItem>
              ) : (
                decks.map((deck) => (
                  <CommandItem key={deck.id} value={`${deck.title} ${deck.id}`} onSelect={() => go(`/app/decks/${deck.id}`)}>
                    <FileText aria-hidden="true" />
                    <span className="truncate">{deck.title}</span>
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          </>
        )}
        <CommandSeparator />
        <CommandGroup heading={m.command.navigation}>
          {pages.map((item) => (
            <CommandItem key={item.href} value={item.label} onSelect={() => go(item.href)}>
              <item.icon aria-hidden="true" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
