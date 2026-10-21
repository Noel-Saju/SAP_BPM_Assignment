// src/components/HistorySidebar.tsx
import { useState } from "react";
import type { HistoryEntry } from "../lib/historyStorage";

type Props = {
  entries: HistoryEntry[];
  selectedId: string | null;
  onSelect: (entry: HistoryEntry) => void;
  onClear: () => void;
};

export default function HistorySidebar({ entries, selectedId, onSelect, onClear }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <aside className="history-sidebar" aria-label="Recent analysis history">
      <div className="history-header">
        <button
          type="button"
          className="history-toggle"
          aria-expanded={expanded}
          aria-controls="history-panel"
          onClick={() => setExpanded((isExpanded) => !isExpanded)}
        >
          <span className={`history-chevron${expanded ? " is-expanded" : ""}`} aria-hidden="true">⌄</span>
          <span>Recent analyses</span>
          <span className="history-count">{entries.length}</span>
        </button>
        {expanded && entries.length > 0 && (
          <button type="button" className="history-clear-button" onClick={onClear}>
            Clear history
          </button>
        )}
      </div>

      {expanded && (
        <div id="history-panel" className="history-panel">
          {entries.length === 0 ? (
            <p className="history-empty">No saved analyses yet.</p>
          ) : (
            <ul className="history-list">
              {entries.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    className={`history-item${entry.id === selectedId ? " is-selected" : ""}`}
                    aria-current={entry.id === selectedId ? "true" : undefined}
                    onClick={() => {
                      onSelect(entry);
                      setExpanded(false);
                    }}
                  >
                    <span className="history-query">
                      {entry.query.length > 90
                        ? `${entry.query.slice(0, 90)}...`
                        : entry.query}
                    </span>
                    <span className="history-date">
                      {new Date(entry.createdAt).toLocaleString()}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </aside>
  );
}