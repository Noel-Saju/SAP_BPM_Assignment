from typing import Protocol

from app.models import ProcessAnalysisResponse


class AnalysisProvider(Protocol):
    async def analyse(self, process_description: str) -> ProcessAnalysisResponse:
        """Return a structured analysis for a process description."""

    async def check_health(self) -> bool:
        """Return whether the provider is configured and available."""