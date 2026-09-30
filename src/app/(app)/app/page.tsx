export const dynamic = "force-dynamic";
import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Filter, Sparkles, LayoutTemplate } from "lucide-react";
import { DeckCard } from "@/components/app/DeckCard";
import { CreateDeckDialog } from "@/components/app/CreateDeckDialog";
import { DashboardFilters } from "./DashboardFilters";
import { listDecksAction } from "./decks/actions";
import { listSystemThemes } from "@/lib/db/repositories/themes";
import type { DeckWithRelations } from "@/lib/db/repositories/decks";

interface DashboardPageProps {
  searchParams: Promise<{ search?: string; sort?: string }>;
}

async function getDecks(search?: string, sort?: string) {
  const result = await listDecksAction({ search, sort });
  if (result.error) return { decks: [] as DeckWithRelations[], total: 0 };
  return { decks: result.decks ?? [], total: result.total ?? 0 };
}

function DeckGrid({ decks }: { decks: DeckWithRelations[] }) {
  if (decks.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {decks.map((deck) => (
        <DeckCard key={deck.id} deck={deck} />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div
      data-testid="dashboard-empty-state"
      className="text-center py-16 border-2 border-dashed border-zinc-800 rounded-2xl"
    >
      <div className="mx-auto w-14 h-14 rounded-2xl bg-violet-600/15 flex items-center justify-center mb-4">
        <Sparkles className="w-7 h-7 text-violet-400" />
      </div>
      <h2 className="text-xl font-semibold text-white">Votre tableau de bord est vide</h2>
      <p className="text-zinc-400 mt-2 max-w-md mx-auto text-sm">
        Collez un script et laissez l&apos;IA générer votre premier deck de vente, ou partez
        d&apos;un cadre éprouvé avec un modèle.
      </p>
      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/app/new">
          <Button className="gap-2 w-full sm:w-auto">
            <Sparkles className="w-4 h-4" />
            Générer votre premier deck
          </Button>
        </Link>
        <Link href="/app/templates">
          <Button variant="outline" className="gap-2 w-full sm:w-auto">
            <LayoutTemplate className="w-4 h-4" />
            Démarrer depuis un modèle
          </Button>
        </Link>
      </div>
    </div>
  );
}

async function DashboardDecks({ search, sort }: { search?: string; sort?: string }) {
  const { decks, total } = await getDecks(search, sort);

  if (total === 0 && !search && !sort) {
    return <EmptyState />;
  }

  if (decks.length === 0) {
    return (
      <div data-testid="dashboard-no-results" className="text-center py-12">
        <p className="text-zinc-400">Aucun deck ne correspond à votre recherche.</p>
      </div>
    );
  }

  return <DeckGrid decks={decks} />;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const search = params.search?.trim() || undefined;
  const sort = params.sort || undefined;

  const systemThemes = await listSystemThemes();

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Tableau de bord</h1>
          <p className="text-zinc-400 mt-1">Vos decks de présentation</p>
        </div>
        <CreateDeckDialog themes={systemThemes.map(({ id, name }) => ({ id, name }))} />
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <DashboardFilters />
          <div className="flex items-center gap-2">
            <Link href="/app/templates">
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Modèles
              </Button>
            </Link>
          </div>
        </div>

        <Suspense
          key={`${search ?? ""}-${sort ?? ""}`}
          fallback={
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-video bg-zinc-800 rounded-xl mb-3" />
                  <div className="h-6 bg-zinc-800 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-zinc-800 rounded w-1/2" />
                </div>
              ))}
            </div>
          }
        >
          <DashboardDecks search={search} sort={sort} />
        </Suspense>
      </div>
    </div>
  );
}
