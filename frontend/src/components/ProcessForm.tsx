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
      <label htmlFor="process-input">Describe your business process:</label>
      <textarea
        id="process-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={8}
        maxLength={10000}
        required
        aria-describedby="process-hint process-count"
        placeholder="e.g. When a customer submits a support ticket, it gets emailed to a shared inbox. Someone manually reads it, assigns it to the right team in a spreadsheet, and the team lead checks the spreadsheet every morning to distribute work."
      />
      <div className="form-meta">
        <p id="process-hint">
          Your description is sent to Google Gemini for analysis. Do not include confidential or personal data.
        </p>
        <p id="process-count" aria-live="polite">{input.length}/10,000</p>
      </div>
      <button type="submit" disabled={loading || !input.trim()}>
        {loading ? "Analysing…" : "Analyse Process"}
      </button>
      {loading && (
        <button type="button" className="cancel-button" onClick={onCancel}>
          Cancel analysis
        </button>
      )}
    </form>
  );
};

export default ProcessForm;
