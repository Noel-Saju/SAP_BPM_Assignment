import type { PriorityLevel, ProcessAnalysisResponse } from "../types";

interface Props {
  data: ProcessAnalysisResponse;
  onPriorityChange: (suggestionIndex: number, priority: PriorityLevel) => void;
}

const ResultsDisplay = ({ data, onPriorityChange }: Props) => {
  return (
    <article className="results" aria-labelledby="results-title" aria-live="polite">
      <header className="results-header">
        <div>
          <p className="results-kicker">Your process review</p>
          <h2 id="results-title">Analysis &amp; recommendations</h2>
          <p className="results-intro">A structured starting point for your next improvement conversation.</p>
        </div>
        <span className="results-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="m5 12.5 4.2 4.2L19.5 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 3.5v2m0 13v2m8-8h-2m-12 0H4m13.7-5.7-1.4 1.4m-8.6 8.6-1.4 1.4m11.4 0-1.4-1.4m-8.6-8.6L6.3 7.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </span>
      </header>

      <div className="results-body">
        <section aria-labelledby="summary-heading">
          <h3 id="summary-heading"><span className="section-index">01</span> Process summary</h3>
          <p className="summary-copy">{data.summary}</p>
        </section>

        <section aria-labelledby="inefficiencies-heading">
          <h3 id="inefficiencies-heading"><span className="section-index">02</span> Inefficiencies &amp; risks</h3>
          {data.inefficiencies.length > 0 ? (
            <ul className="risk-list">
              {data.inefficiencies.map((item, index) => (
                <li key={`${item}-${index}`}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="empty-state">No specific inefficiencies or risks were identified.</p>
          )}
        </section>

        <section aria-labelledby="suggestions-heading">
          <h3 id="suggestions-heading"><span className="section-index">03</span> Improvement opportunities</h3>
          {data.suggestions.length > 0 ? (
            <div className="suggestion-list">
              {data.suggestions.map((suggestion, index) => (
                <article className="suggestion" key={`${suggestion.title}-${index}`}>
                  <div className="suggestion-heading">
                    <h4>{suggestion.title}</h4>
                  </div>
                  <p className="suggestion-description">{suggestion.description}</p>
                  <div className="suggestion-meta">
                    <span className={`priority priority-${suggestion.priority}`}>
                      {suggestion.priority} priority
                    </span>
                    <span className={`complexity complexity-${suggestion.complexity}`}>
                      {suggestion.complexity} effort
                    </span>
                    <label className="priority-control">
                      Adjust priority
                      <select
                        aria-label={`Adjust priority for ${suggestion.title}`}
                        value={suggestion.priority}
                        onChange={(event) =>
                          onPriorityChange(index, event.target.value as PriorityLevel)
                        }
                      >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </label>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="empty-state">No improvement suggestions were returned. Try adding more detail about how the process works.</p>
          )}
        </section>
      </div>
    </article>
  );
};

export default ResultsDisplay;
