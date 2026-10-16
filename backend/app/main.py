import asyncio
import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from app.agent import ProcessAnalysisAgent
from app.config import Settings
from app.models import ProcessAnalysisResponse, ProcessInput
from app.providers.gemini import (
    GeminiAnalysisProvider,
    ProviderConfigurationError,
    ProviderOverloadedError,
    ProviderTimeoutError,
    ProviderUnavailableError,
)
from app.providers.base import AnalysisProvider
from app.rate_limit import InMemoryRateLimiter

logger = logging.getLogger(__name__)


def create_app(
    settings: Settings | None = None,
    provider: AnalysisProvider | None = None,
) -> FastAPI:
    settings = settings or Settings.from_env()
    provider = provider or GeminiAnalysisProvider(settings)
    agent = ProcessAnalysisAgent(provider)
    limiter = InMemoryRateLimiter(
        settings.rate_limit_requests, settings.rate_limit_window_seconds
    )
    semaphore = asyncio.Semaphore(settings.max_concurrent_analyses)

    application = FastAPI(title="Process Improvement Agent")
    application.state.settings = settings
    application.state.agent = agent
    application.state.provider = provider
    application.state.limiter = limiter
    application.state.analysis_semaphore = semaphore

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
    )

    @application.post("/analyse", response_model=ProcessAnalysisResponse)
    async def analyse(body: ProcessInput, request: Request) -> ProcessAnalysisResponse:
        client_id = request.client.host if request.client else "unknown"
        if not await limiter.allow(client_id):
            raise HTTPException(
                status_code=429,
                detail="Too many analysis requests. Please wait and try again.",
                headers={"Retry-After": str(settings.rate_limit_window_seconds)},
            )

        try:
            await asyncio.wait_for(semaphore.acquire(), timeout=1)
        except asyncio.TimeoutError as exc:
            raise HTTPException(
                status_code=503,
                detail="The analysis service is busy. Please try again shortly.",
                headers={"Retry-After": "5"},
            ) from exc

        try:
            return await agent.analyse(body.process_description)
        except ProviderConfigurationError as exc:
            logger.error("Analysis provider configuration is missing")
            raise HTTPException(
                status_code=503,
                detail="Analysis is not configured. Ask the application administrator to check the server setup.",
            ) from exc
        except ProviderTimeoutError as exc:
            raise HTTPException(
                status_code=504,
                detail="Analysis took too long. Please try again.",
            ) from exc
        except ProviderOverloadedError as exc:
            raise HTTPException(
                status_code=503,
                detail="Google Gemini is temporarily busy. Please wait a moment and try again.",
                headers={"Retry-After": "10"},
            ) from exc
        except ProviderUnavailableError as exc:
            logger.warning("Analysis provider request failed")
            raise HTTPException(
                status_code=502,
                detail="The analysis service is temporarily unavailable. Please try again.",
            ) from exc
        except Exception as exc:
            logger.exception("Unexpected process analysis failure")
            raise HTTPException(
                status_code=500,
                detail="The analysis could not be completed. Please try again later.",
            ) from exc
        finally:
            semaphore.release()

    @application.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    @application.get("/ready")
    async def ready() -> dict[str, str]:
        if not settings.api_key:
            raise HTTPException(
                status_code=503,
                detail="The analysis provider is not configured.",
            )
        try:
            configured = await agent.check_provider_health()
        except Exception:
            configured = False
        if not configured:
            raise HTTPException(
                status_code=503,
                detail="The analysis provider is not configured.",
            )
        return {"status": "ready"}

    return application


app = create_app()
