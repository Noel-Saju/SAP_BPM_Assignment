import { useState } from "react";

interface Props {
  onSubmit: (processDescription: string) => void;
  onCancel: () => void;
  loading: boolean;
}

const ProcessForm = ({ onSubmit, onCancel, loading }: Props) => {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(input);
  };

  return (
    <form onSubmit={handleSubmit} className="process-form">
      <div className="form-label-row">
        <label htmlFor="process-input">Your process, as it works today</label>
        <span className="form-step">01 / Describe</span>
      </div>
      <textarea
        id="process-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={8}
        maxLength={10000}
        required
        aria-describedby="process-hint process-count"
        placeholder="For example: A customer sends a support request by email. A coordinator reads it, assigns a category and owner in a spreadsheet, then the team lead distributes work each morning."
      />
      <div className="form-meta">
        <p className="privacy-hint" id="process-hint">
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
            <rect x="4" y="8" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 8V5.8a3 3 0 0 1 6 0V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Your description is sent to Google Gemini for analysis. Do not include confidential or personal data.
        </p>
        <p className="char-count" id="process-count" aria-live="polite">{input.length.toLocaleString()}/10,000</p>
      </div>
      <div className="form-actions">
        <button className="primary-button" type="submit" disabled={loading || !input.trim()}>
          {loading ? "Analysing…" : "Analyse process"}
          {!loading && <svg aria-hidden="true" viewBox="0 0 20 20" fill="none"><path d="M3.5 10h12m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
        </button>
        {loading && (
          <button type="button" className="cancel-button" onClick={onCancel}>
            Cancel analysis
          </button>
        )}
      </div>
      <p className="helper-copy">Usually takes around 10–30 seconds. You can cancel at any time.</p>
    </form>
  );
};

export default ProcessForm;
