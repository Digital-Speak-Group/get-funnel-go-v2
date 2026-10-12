export const dynamic = "force-dynamic";
import { Suspense } from "react";
import Link from "next/link";
import { LayoutTemplate, SearchX, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/app/patterns/EmptyState";
import { PageHeader } from "@/components/app/patterns/PageHeader";
import { DeckCard } from "@/components/app/dashboard/DeckCard";
import { CreateDeckDialog } from "@/components/app/dashboard/CreateDeckDialog";
import { dashboardMessages as m } from "@/components/app/dashboard/messages";
import { DashboardFilters } from "./DashboardFilters";
import { listDecksAction } from "./decks/actions";
import { listSystemThemes } from "@/lib/db/repositories/themes";
import type { DeckWithRelations } from "@/lib/db/repositories/decks";

interface DashboardPageProps {
  searchParams: Promise<{ search?: string; sort?: string }>;
}

const GRID = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4";

async function getDecks(search?: string, sort?: string) {
  const result = await listDecksAction({ search, sort });
  if (result.error) return { decks: [] as DeckWithRelations[], total: 0 };
  return { decks: result.decks ?? [], total: result.total ?? 0 };
}

function DeckGridSkeleton() {
  return (
    <div className={GRID} aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-lg border border-border bg-surface">
          <Skeleton className="aspect-video rounded-none" />
          <div className="space-y-2 p-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

async function DashboardDecks({ search, sort }: { search?: string; sort?: string }) {
  const { decks, total } = await getDecks(search, sort);

  if (total === 0 && !search) {
    return (
      <EmptyState
        data-testid="dashboard-empty-state"
        icon={Sparkles}
        title={m.empty.title}
        description={m.empty.description}
        actions={
          <>
            <Button asChild>
              <Link href="/app/new">
                <Sparkles />
                {m.empty.generate}
              </Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/app/templates">
                <LayoutTemplate />
                {m.empty.template}
              </Link>
            </Button>
          </>
        }
      />
    );
  }

  if (decks.length === 0) {
    return (
      <EmptyState
        data-testid="dashboard-no-results"
        size="compact"
        icon={SearchX}
        title={m.noResults.title}
        description={m.noResults.description}
        actions={
          <Button variant="secondary" size="sm" asChild>
            <Link href={sort ? `/app?sort=${sort}` : "/app"}>{m.noResults.clear}</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-small text-faint" aria-live="polite">
        {m.count(total)}
      </p>
      <div className={GRID}>
        {decks.map((deck) => (
          <DeckCard key={deck.id} deck={deck} />
        ))}
      </div>
    </div>
  );
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const search = params.search?.trim() || undefined;
  const sort = params.sort || undefined;

  const systemThemes = await listSystemThemes();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title={m.title}
        description={m.description}
        actions={
          <>
            <Suspense fallback={null}>
              <CreateDeckDialog themes={systemThemes} />
            </Suspense>
            <Button asChild>
              <Link href="/app/new">
                <Sparkles />
                {m.generate}
              </Link>
            </Button>
          </>
        }
      />

      <Suspense fallback={null}>
        <DashboardFilters />
      </Suspense>

      <Suspense key={`${search ?? ""}-${sort ?? ""}`} fallback={<DeckGridSkeleton />}>
        <DashboardDecks search={search} sort={sort} />
      </Suspense>
    </div>
  );
}
