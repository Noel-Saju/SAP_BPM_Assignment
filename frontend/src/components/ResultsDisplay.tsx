import { ProcessAnalysisResponse } from "../types";

interface Props {
  data: ProcessAnalysisResponse;
}

const ResultsDisplay = ({ data }: Props) => {
  return (
    <div className="results">
      <h2>Analysis Results</h2>
      <section aria-labelledby="summary-heading">
        <h3 id="summary-heading">Process summary</h3>
        <p>{data.summary}</p>
      </section>

      <section aria-labelledby="inefficiencies-heading">
        <h3 id="inefficiencies-heading">Inefficiencies and risks</h3>
        {data.inefficiencies.length > 0 ? (
          <ul>
            {data.inefficiencies.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        ) : (
          <p>No specific inefficiencies or risks were identified.</p>
        )}
      </section>

      <section aria-labelledby="suggestions-heading">
        <h3 id="suggestions-heading">Improvement suggestions</h3>
        {data.suggestions.length > 0 ? (
          <div className="suggestions">
            {data.suggestions.map((suggestion, index) => (
              <article className="suggestion" key={`${suggestion.title}-${index}`}>
                <div className="suggestion-heading">
                  <h4>{suggestion.title}</h4>
                  <span className={`complexity complexity-${suggestion.complexity}`}>
                    {suggestion.complexity} complexity
                  </span>
                </div>
                <p>{suggestion.description}</p>
              </article>
            ))}
          </div>
        ) : (
          <p>No improvement suggestions were returned.</p>
        )}
      </section>
    </div>
  );
};

export default ResultsDisplay;
