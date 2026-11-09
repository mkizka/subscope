import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { fetchJson } from "@/app/lib/fetch-json";
import type { AccountDto } from "@/app/server/application/dto/account";

import { SidebarSearch } from "./sidebar-search";
import { useSearchHistory } from "./use-search-history";

export function SidebarSearchContainer() {
  const { history, remove, clear } = useSearchHistory();
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q.trim()), 200);
    return () => clearTimeout(timer);
  }, [q]);

  const { data } = useQuery({
    queryKey: ["search-typeahead", debouncedQ],
    queryFn: () =>
      fetchJson<AccountDto[]>(
        `/api/search-typeahead?${new URLSearchParams({ q: debouncedQ })}`,
      ),
    enabled: debouncedQ !== "",
  });

  return (
    <SidebarSearch
      inputProps={{ value: q, onChange: (e) => setQ(e.target.value) }}
      suggestions={q.trim() === "" ? [] : (data ?? [])}
      onSelect={() => setQ("")}
      history={q.trim() === "" ? history : []}
      onRemoveHistory={remove}
      onClearHistory={clear}
    />
  );
}
