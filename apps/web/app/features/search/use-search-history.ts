import { useCallback, useEffect, useState } from "react";
import { z } from "zodV4";

const schema = z.array(z.string());
const KEY = "search-history";
const MAX = 10;

const load = (): string[] => {
  try {
    return schema.parse(JSON.parse(localStorage.getItem(KEY) ?? "[]"));
  } catch {
    return [];
  }
};

export function useSearchHistory(q?: string) {
  const [history, setHistory] = useState<string[]>([]);

  const update = useCallback((next: string[]) => {
    setHistory(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // localStorageが使えない環境では履歴を保存しない
    }
  }, []);

  useEffect(() => {
    const current = load();
    update(q ? [q, ...current.filter((w) => w !== q)].slice(0, MAX) : current);
  }, [q, update]);

  return {
    history,
    remove: (word: string) => update(history.filter((w) => w !== word)),
    clear: () => update([]),
  };
}
