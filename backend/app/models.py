from enum import Enum

from pydantic import BaseModel, Field, field_validator


class ComplexityLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class PriorityLevel(str, Enum):
    high = "high"
    medium = "medium"
    low = "low"


class ImprovementSuggestion(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1, max_length=2000)
    complexity: ComplexityLevel
    priority: PriorityLevel


class ProcessAnalysisResponse(BaseModel):
    summary: str = Field(min_length=1, max_length=2000)
    inefficiencies: list[str] = Field(max_length=20)
    suggestions: list[ImprovementSuggestion] = Field(max_length=20)

    @field_validator("inefficiencies")
    @classmethod
    def validate_inefficiencies(cls, value: list[str]) -> list[str]:
        if any(not item.strip() or len(item) > 1000 for item in value):
            raise ValueError("Inefficiencies must be non-empty and at most 1000 characters")
        return [item.strip() for item in value]

    @field_validator("suggestions")
    @classmethod
    def order_suggestions_by_priority(
        cls, value: list[ImprovementSuggestion]
    ) -> list[ImprovementSuggestion]:
        priority_order = {
            PriorityLevel.high: 0,
            PriorityLevel.medium: 1,
            PriorityLevel.low: 2,
        }
        return sorted(value, key=lambda suggestion: priority_order[suggestion.priority])


class ProcessInput(BaseModel):
    process_description: str = Field(min_length=1, max_length=10000)

    @field_validator("process_description", mode="before")
    @classmethod
    def strip_process_description(cls, value: object) -> object:
        return value.strip() if isinstance(value, str) else value
