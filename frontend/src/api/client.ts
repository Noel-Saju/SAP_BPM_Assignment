import { ProcessAnalysisResponse } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export async function analyseProcess(
  processDescription: string
): Promise<ProcessAnalysisResponse> {
  const response = await fetch(`${API_BASE}/analyse`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ process_description: processDescription }),
  });

  if (!response.ok) {
    let message = `The analysis request failed (${response.status}).`;
    try {
      const body: { detail?: unknown } = await response.json();
      if (typeof body.detail === "string") {
        message = body.detail;
      }
    } catch {
      // Keep the status-based message when the server response is not JSON.
    }
    throw new Error(message);
  }

  return response.json();
}
