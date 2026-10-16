export type ComplexityLevel = "low" | "medium" | "high";
export type PriorityLevel = "high" | "medium" | "low";

export interface ImprovementSuggestion {
  title: string;
  description: string;
  complexity: ComplexityLevel;
  priority: PriorityLevel;
}

export interface ProcessAnalysisResponse {
  summary: string;
  inefficiencies: string[];
  suggestions: ImprovementSuggestion[];
}
