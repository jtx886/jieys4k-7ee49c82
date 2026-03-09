const KEY = "jieys4k_search_history";

function safeParse(value: string | null): unknown {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export function readSearchHistory(): string[] {
  if (typeof window === "undefined") return [];
  const parsed = safeParse(window.localStorage.getItem(KEY));
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}

export function writeSearchHistory(items: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(items));
}

export function addSearchHistoryItem(query: string, max = 12): string[] {
  const q = query.trim();
  if (!q) return readSearchHistory();
  const prev = readSearchHistory();
  const next = [q, ...prev.filter((x) => x !== q)].slice(0, max);
  writeSearchHistory(next);
  return next;
}

export function clearSearchHistory() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
