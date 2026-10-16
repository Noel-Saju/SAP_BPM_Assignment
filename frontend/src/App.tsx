import { useState } from "react";
import ProcessForm from "./components/ProcessForm";
import ResultsDisplay from "./components/ResultsDisplay";
import { analyseProcess } from "./api/client";
import { ProcessAnalysisResponse } from "./types";

function App() {
  const [result, setResult] = useState<ProcessAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (processDescription: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await analyseProcess(processDescription);
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to analyse the process. Please try again."
      );
    } finally {
      setLoading(false);
    }
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
        <ProcessForm onSubmit={handleSubmit} loading={loading} />
        {loading && (
          <p className="status" role="status">
            Analysing your process…
          </p>
        )}
        {error && <p className="error" role="alert">{error}</p>}
        {result && <ResultsDisplay data={result} />}
      </main>
    </div>
  );
}

export default App;
