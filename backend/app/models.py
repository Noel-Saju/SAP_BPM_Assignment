from enum import Enum

from pydantic import BaseModel, Field, field_validator


class ComplexityLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class ImprovementSuggestion(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1, max_length=2000)
    complexity: ComplexityLevel


class ProcessAnalysisResponse(BaseModel):
    summary: str = Field(min_length=1, max_length=2000)
    inefficiencies: list[str] = Field(max_length=20)
    suggestions: list[ImprovementSuggestion] = Field(max_length=20)


class ProcessInput(BaseModel):
    process_description: str = Field(min_length=1, max_length=10000)

    @field_validator("process_description", mode="before")
    @classmethod
    def strip_process_description(cls, value: object) -> object:
        return value.strip() if isinstance(value, str) else value
