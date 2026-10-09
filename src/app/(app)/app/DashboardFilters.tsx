"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DECK_SORTS, dashboardMessages as m, type DeckSort } from "@/components/app/dashboard/messages";

const DEFAULT_SORT: DeckSort = "updated_desc";

function isDeckSort(value: string | null): value is DeckSort {
  return DECK_SORTS.some((sort) => sort === value);
}

export function DashboardFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = React.useState(searchParams.get("search") || "");
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const sortParam = searchParams.get("sort");
  const sort = isDeckSort(sortParam) ? sortParam : DEFAULT_SORT;

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
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative sm:w-80">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" aria-hidden="true" />
        <Input
          type="search"
          placeholder={m.searchPlaceholder}
          className="pl-9"
          onChange={(e) => handleSearchChange(e.target.value)}
          value={searchValue}
          aria-label={m.search}
        />
      </div>
      <Select value={sort} onValueChange={(value) => pushParam("sort", value)}>
        <SelectTrigger className="sm:w-44" aria-label={m.sort.label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {DECK_SORTS.map((value) => (
            <SelectItem key={value} value={value}>
              {m.sort[value]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
