"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = React.useState(searchParams.get("search") || "");
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  function pushParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/app?${params.toString()}`);
  }

  function handleSearchChange(value: string) {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => pushParam("search", value.trim()), 350);
  }

  React.useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col sm:flex-row gap-4 flex-1">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
        <input
          type="text"
          placeholder="Rechercher un deck..."
          className={cn(
            "w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg",
            "text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
          )}
          onChange={(e) => handleSearchChange(e.target.value)}
          value={searchValue}
          aria-label="Rechercher un deck"
        />
      </div>
      <div className="flex items-center gap-2">
        <select
          className={cn(
            "px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg",
            "text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
          )}
          onChange={(e) => pushParam("sort", e.target.value)}
          defaultValue={searchParams.get("sort") || ""}
          aria-label="Trier les decks"
        >
          <option value="">Trier par</option>
          <option value="updated_desc">Plus récents</option>
          <option value="updated_asc">Plus anciens</option>
          <option value="title_asc">Titre (A-Z)</option>
          <option value="title_desc">Titre (Z-A)</option>
        </select>
      </div>
    </div>
  );
}
