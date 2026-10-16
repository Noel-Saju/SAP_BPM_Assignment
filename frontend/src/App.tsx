import { useEffect, useRef, useState } from "react";
import ProcessForm from "./components/ProcessForm";
import ResultsDisplay from "./components/ResultsDisplay";
import { analyseProcess } from "./api/client";
import type { PriorityLevel, ProcessAnalysisResponse } from "./types";

function App() {
  const [result, setResult] = useState<ProcessAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
    },
    []
  );

  const handleSubmit = async (processDescription: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    try {
      const data = await analyseProcess(processDescription, controller.signal);
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
      <header>
        <h1>Process Improvement Agent</h1>
        <p className="subtitle">
          Describe a business process and get AI-powered improvement suggestions.
        </p>
      </header>

      <main>
        <ProcessForm onSubmit={handleSubmit} onCancel={handleCancel} loading={loading} />
        {loading && (
          <p className="status" role="status">
            Analysing your process…
          </p>
        )}
        {error && <p className="error" role="alert">{error}</p>}
        {result && <ResultsDisplay data={result} onPriorityChange={handlePriorityChange} />}
      </main>
    </div>
  );
}

export default App;
