import type { ProcessAnalysisResponse } from "../types";

export type HistoryEntry = {
  id: string;
  query: string;
  response: ProcessAnalysisResponse;
  createdAt: string;
};

const HISTORY_KEY = "process-analysis-history";

function normalizeHistory(entries: HistoryEntry[]): HistoryEntry[] {
  const deduped = new Map<string, HistoryEntry>();

  for (const entry of [...entries].sort(
    (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt)
  )) {
    const key = entry.query.trim().toLowerCase();
    if (!deduped.has(key)) {
      deduped.set(key, entry);
    }
  }

  return [...deduped.values()].slice(0, 20);
}

export async function readHistory(): Promise<HistoryEntry[]> {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return normalizeHistory(parsed as HistoryEntry[]);
  } catch {
    return [];
  }
}

export async function writeHistory(entries: HistoryEntry[]) {
  const normalized = normalizeHistory(entries);

  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(normalized));
  } catch {
    // ignore quota errors in a local-only implementation
  }

  return normalized;
}

export async function addHistoryEntry(entry: HistoryEntry): Promise<HistoryEntry[]> {
  const next = normalizeHistory([entry, ...(await readHistory())]);
  return writeHistory(next);
}

export async function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}