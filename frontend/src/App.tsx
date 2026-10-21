import { useEffect, useRef, useState } from "react";
import ProcessForm from "./components/ProcessForm";
import HistorySidebar from "./components/HistorySidebar";
import {
  addHistoryEntry,
  clearHistory,
  readHistory,
  type HistoryEntry,
} from "./lib/historyStorage";
import ResultsDisplay from "./components/ResultsDisplay";
import { analyseProcess } from "./api/client";
import type { PriorityLevel, ProcessAnalysisResponse } from "./types";

const SparkleIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
    <path
      d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
    <path
      d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z"
      fill="currentColor"
    />
  </svg>
);

const LockIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
    <rect x="5" y="10" width="14" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
    <path d="M8 10V7a4 4 0 1 1 8 0v3m-4 5v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

const ArrowIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
    <path d="M3.5 10h12m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function App() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [processDescription, setProcessDescription] = useState("");
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    void (async () => {
      setHistory(await readHistory());
    })();
  }, []);

  useEffect(
    () => () => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
    },
    []
  );

  const handleSubmit = async (processDescription: string) => {
    setSelectedHistoryId(null);
    setLoading(true);
    setError(null);
    setResult(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const data = await analyseProcess(processDescription, controller.signal);

      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        query: processDescription,
        response: data,
        createdAt: new Date().toISOString(),
      };

      const nextHistory = await addHistoryEntry(entry);
      setHistory(nextHistory);
      setSelectedHistoryId(entry.id);
      setResult(data);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;

      setError(
        err instanceof Error
          ? err.message
          : "Unable to analyse the process. Please try again."
      );
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
        setLoading(false);
      }
    }
  };

  const handleCancel = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setLoading(false);
    setError(null);
  };

  const handleSelectHistory = (entry: HistoryEntry) => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setLoading(false);
    setProcessDescription(entry.query);
    setSelectedHistoryId(entry.id);
    setResult(entry.response);
    setError(null);
  };

  const handleClearHistory = async () => {
    await clearHistory();
    setHistory([]);
  };

  const handlePriorityChange = (suggestionIndex: number, priority: PriorityLevel) => {
    setResult((current) => {
      if (!current) return current;

      const priorityOrder: Record<PriorityLevel, number> = { high: 0, medium: 1, low: 2 };
      const suggestions = current.suggestions.map((suggestion, index) =>
        index === suggestionIndex ? { ...suggestion, priority } : suggestion
      );

      suggestions.sort(
        (left, right) => priorityOrder[left.priority] - priorityOrder[right.priority]
      );

      return { ...current, suggestions };
    });
  };

  return (
    <div className="app">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <header className="site-header">
        <span className="brand-mark">
          <SparkleIcon />
        </span>
        <span>
          <span className="brand-name">Process intelligence</span>
          <span className="brand-caption">Improvement workspace</span>
        </span>
      </header>

      <main id="main-content" className="app-layout">
        <HistorySidebar
          entries={history}
          selectedId={selectedHistoryId}
          onSelect={handleSelectHistory}
          onClear={handleClearHistory}
        />

        <div className="main-content">
          <section className="hero" aria-labelledby="page-title">
            <p className="eyebrow">Make work flow better</p>
            <h1 id="page-title">
              Find a better way to <span>work.</span>
            </h1>
            <p className="subtitle">
              Describe how a process works today. Get a clear view of friction, risk, and practical ways to improve it.
            </p>
          </section>

          <ProcessForm
            processDescription={processDescription}
            onDescriptionChange={setProcessDescription}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={loading}
          />

          {loading && (
            <p className="status" role="status">
              <span className="loading-dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              <span className="status-content">
                <strong>Reviewing your process</strong>
                <span>Looking for bottlenecks, handoffs, and opportunities.</span>
              </span>
            </p>
          )}

          {error && (
            <div className="error" role="alert">
              <span aria-hidden="true">!</span>
              <span className="error-content">
                <strong>We couldn’t complete the analysis</strong>
                <span>{error}</span>
              </span>
            </div>
          )}

          {result && (
            <ResultsDisplay data={result} onPriorityChange={handlePriorityChange} />
          )}
        </div>
      </main>

      <footer className="site-footer">
        <LockIcon />
        <span>Your description is sent to Google Gemini. Please leave out sensitive information.</span>
        <ArrowIcon />
      </footer>
    </div>
  );
}

export default App;