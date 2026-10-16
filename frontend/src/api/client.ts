import type { ComplexityLevel, PriorityLevel, ProcessAnalysisResponse } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const REQUEST_TIMEOUT_MS = 60_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function parseAnalysisResponse(value: unknown): ProcessAnalysisResponse {
  const complexityLevels: ComplexityLevel[] = ["low", "medium", "high"];
  const priorityLevels: PriorityLevel[] = ["high", "medium", "low"];
  if (
    !isRecord(value) ||
    typeof value.summary !== "string" ||
    !value.summary.trim() ||
    value.summary.length > 2000 ||
    !isStringArray(value.inefficiencies) ||
    value.inefficiencies.length > 20 ||
    value.inefficiencies.some((item) => !item.trim() || item.length > 1000) ||
    !Array.isArray(value.suggestions)
  ) {
    throw new Error("The analysis service returned an invalid response. Please try again.");
  }

  const validSuggestions = value.suggestions.every(
    (suggestion) =>
      isRecord(suggestion) &&
      typeof suggestion.title === "string" &&
      suggestion.title.trim().length > 0 &&
      suggestion.title.length <= 200 &&
      typeof suggestion.description === "string" &&
      suggestion.description.trim().length > 0 &&
      suggestion.description.length <= 2000 &&
      complexityLevels.includes(suggestion.complexity as ComplexityLevel) &&
      priorityLevels.includes(suggestion.priority as PriorityLevel)
  );
  if (!validSuggestions) {
    throw new Error("The analysis service returned incomplete suggestions. Please try again.");
  }
  const priorityOrder: Record<PriorityLevel, number> = { high: 0, medium: 1, low: 2 };
  const suggestions = value.suggestions as ProcessAnalysisResponse["suggestions"];
  return {
    summary: value.summary,
    inefficiencies: value.inefficiencies,
    suggestions: [...suggestions].sort(
      (left, right) =>
        priorityOrder[left.priority] - priorityOrder[right.priority]
    ),
  };
}

export async function analyseProcess(
  processDescription: string,
  signal?: AbortSignal
): Promise<ProcessAnalysisResponse> {
  if (!API_BASE) {
    throw new Error("The frontend is not configured. Set VITE_API_BASE_URL in frontend/.env.local.");
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(new DOMException("Request timed out", "TimeoutError")),
    REQUEST_TIMEOUT_MS
  );
  const forwardAbort = () => controller.abort(signal?.reason);
  signal?.addEventListener("abort", forwardAbort, { once: true });

  try {
    if (signal?.aborted) forwardAbort();
    const response = await fetch(`${API_BASE}/analyse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ process_description: processDescription }),
      signal: controller.signal,
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("Too many requests. Please wait a moment before trying again.");
      }
      if (response.status === 503) {
        throw new Error("The analysis service is not ready or is busy. Please try again shortly.");
      }
      if (response.status === 504) {
        throw new Error("Analysis timed out. Please try again with a shorter description.");
      }
      if (response.status >= 500) {
        throw new Error("The analysis service is temporarily unavailable. Please try again later.");
      }
      throw new Error(`The request was rejected (${response.status}). Check the description and try again.`);
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new Error("The analysis service returned an unreadable response. Please try again.");
    }
    return parseAnalysisResponse(payload);
  } catch (error) {
    if (controller.signal.reason?.name === "TimeoutError") {
      throw new Error("Analysis timed out. Please try again with a shorter description.");
    }
    if (controller.signal.aborted) {
      throw new DOMException("Analysis cancelled", "AbortError");
    }
    if (error instanceof TypeError) {
      throw new Error("Could not reach the analysis server. Check that the backend is running.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
    signal?.removeEventListener("abort", forwardAbort);
  }
}
