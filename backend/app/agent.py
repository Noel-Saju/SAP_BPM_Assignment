from app.models import ProcessAnalysisResponse
from app.providers.base import AnalysisProvider


class ProcessAnalysisAgent:
    """Orchestrates process analysis through an interchangeable provider."""

    def __init__(self, provider: AnalysisProvider):
        self._provider = provider

    async def analyse(self, process_description: str) -> ProcessAnalysisResponse:
        return await self._provider.analyse(process_description)

    async def check_provider_health(self) -> bool:
        return await self._provider.check_health()