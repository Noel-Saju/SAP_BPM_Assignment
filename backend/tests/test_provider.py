import asyncio
import json
import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from app.config import Settings
from app.models import ProcessAnalysisResponse
from app.providers.gemini import GeminiAnalysisProvider, ProviderTimeoutError


class AsyncClientContext:
    def __init__(self, models):
        self.models = models

    async def __aenter__(self):
        return self

    async def __aexit__(self, *_args):
        return None


class UpstreamError(Exception):
    def __init__(self, code: int):
        super().__init__(f"upstream status {code}")
        self.code = code


def settings(timeout: float = 1) -> Settings:
    return Settings(
        api_key="test-key",
        model="gemini-flash-latest",
        cors_origins=["http://localhost:5173"],
        host="127.0.0.1",
        port=8000,
        provider_timeout_seconds=timeout,
        max_concurrent_analyses=2,
        rate_limit_requests=5,
        rate_limit_window_seconds=60,
        fallback_models=("gemini-3.6-flash", "gemini-2.5-flash"),
    )


def provider_payload() -> dict:
    return {
        "summary": "Invoices are reviewed manually.",
        "inefficiencies": ["Manual checks take time."],
        "suggestions": [
            {
                "title": "Automate checks",
                "description": "Validate common fields automatically.",
                "complexity": "low",
                "priority": "high",
            }
        ],
    }


class GeminiProviderTests(unittest.IsolatedAsyncioTestCase):
    async def test_falls_back_to_next_model_when_primary_is_overloaded(self):
        response_payload = provider_payload()
        models = SimpleNamespace(
            generate_content=AsyncMock(
                side_effect=[
                    UpstreamError(503),
                    SimpleNamespace(parsed=response_payload, text=json.dumps(response_payload)),
                ]
            )
        )
        client = SimpleNamespace(aio=AsyncClientContext(models))
        with patch("app.providers.gemini.genai.Client", return_value=client):
            result = await GeminiAnalysisProvider(settings()).analyse("Review invoices")

        self.assertEqual(result.summary, response_payload["summary"])
        self.assertEqual(models.generate_content.await_count, 2)
        self.assertEqual(
            models.generate_content.await_args_list[1].kwargs["model"],
            "gemini-3.6-flash",
        )

    async def test_uses_structured_output_and_validates_result(self):
        models = SimpleNamespace(
            generate_content=AsyncMock(
                return_value=SimpleNamespace(
                    parsed=provider_payload(), text=json.dumps(provider_payload())
                )
            )
        )
        client = SimpleNamespace(aio=AsyncClientContext(models))
        with patch("app.providers.gemini.genai.Client", return_value=client):
            result = await GeminiAnalysisProvider(settings()).analyse("Review invoices")

        self.assertIsInstance(result, ProcessAnalysisResponse)
        self.assertEqual(result.suggestions[0].priority.value, "high")
        config = models.generate_content.await_args.kwargs["config"]
        self.assertEqual(config.response_mime_type, "application/json")
        self.assertIs(config.response_schema, ProcessAnalysisResponse)

    async def test_provider_call_is_cancelled_at_configured_deadline(self):
        async def slow_response(**_kwargs):
            await asyncio.sleep(1)

        models = SimpleNamespace(generate_content=AsyncMock(side_effect=slow_response))
        client = SimpleNamespace(aio=AsyncClientContext(models))
        with patch("app.providers.gemini.genai.Client", return_value=client):
            with self.assertRaises(ProviderTimeoutError):
                await GeminiAnalysisProvider(settings(timeout=0.01)).analyse("Review invoices")


if __name__ == "__main__":
    unittest.main()
