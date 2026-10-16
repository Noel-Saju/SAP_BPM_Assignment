import { ProcessAnalysisResponse } from "../types";

const API_BASE = "http://localhost:8000";

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
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}
