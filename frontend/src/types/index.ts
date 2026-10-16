export type ComplexityLevel = "low" | "medium" | "high";

export interface ImprovementSuggestion {
  title: string;
  description: string;
  complexity: ComplexityLevel;
}

export interface ProcessAnalysisResponse {
  summary: string;
  inefficiencies: string[];
  suggestions: ImprovementSuggestion[];
}
