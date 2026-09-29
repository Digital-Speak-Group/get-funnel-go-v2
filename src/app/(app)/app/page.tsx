import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Filter, Plus } from "lucide-react";
import { DeckCard } from "@/components/app/DeckCard";
import { DashboardFilters } from "./DashboardFilters";
import { listDecksAction, updateDeckAction, deleteDeckAction } from "./decks/actions";
import type { DeckWithRelations } from "@/lib/db/repositories/decks";

async function getDecks() {
  const result = await listDecksAction();
  if (result.error) return { decks: [] as DeckWithRelations[], total: 0 };
  return { decks: result.decks ?? [], total: result.total ?? 0 };
}

function DeckGrid({ decks, onRename, onDelete, onDuplicate }: { 
  decks: DeckWithRelations[]; 
  onRename: (id: string, title: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onDuplicate: (id: string) => Promise<void>;
}) {
  if (decks.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {decks.map((deck) => (
        <DeckCard
          key={deck.id}
          deck={deck}
          onRename={onRename}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
        />
      ))}
    </div>
  );
}

async function DashboardContent() {
  const { total } = await getDecks();

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Tableau de bord</h1>
          <p className="text-zinc-400 mt-1">{total} deck{total > 1 ? "s" : ""}</p>
        </div>
        <Link href="/app/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto gap-2">
            <Plus className="w-5 h-5" />
            Nouveau deck
          </Button>
        </Link>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 space-y-4">
        <DashboardFilters />
          <div className="flex items-center gap-2 -mt-2 sm:mt-0">
            <Link href="/app/templates">
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Modèles
              </Button>
            </Link>
          </div>

        <Suspense fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-video bg-zinc-800 rounded-xl mb-3" />
                <div className="h-6 bg-zinc-800 rounded w-3/4 mb-2" />
                <div className="h-4 bg-zinc-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        }>
          <DashboardDecks />
        </Suspense>
      </div>
    </div>
  );
}

async function DashboardDecks() {
  const { decks } = await getDecks();

  async function handleRename(id: string, title: string) {
    await updateDeckAction({ id, title });
  }

  async function handleDelete(id: string) {
    await deleteDeckAction(id);
  }

  async function handleDuplicate(id: string) {
    await fetch("/app/duplicate", { method: "POST", body: JSON.stringify({ id }) });
  }

  return (
    <DeckGrid
      decks={decks}
      onRename={handleRename}
      onDelete={handleDelete}
      onDuplicate={handleDuplicate}
    />
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <Suspense fallback={<div className="h-32 animate-pulse bg-zinc-900/50 rounded-2xl" />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}