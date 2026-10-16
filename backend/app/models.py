from pydantic import BaseModel
from typing import List
from enum import Enum


class ComplexityLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class ImprovementSuggestion(BaseModel):
    title: str
    description: str
    complexity: ComplexityLevel


class ProcessAnalysisResponse(BaseModel):
    summary: str
    inefficiencies: List[str]
    suggestions: List[ImprovementSuggestion]


class ProcessInput(BaseModel):
    process_description: str
