import os
import unittest

os.environ.setdefault("CORS_ORIGINS", "http://localhost:5173")

from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app
from app.models import ProcessAnalysisResponse
from app.providers.gemini import (
    ProviderConfigurationError,
    ProviderOverloadedError,
    ProviderTimeoutError,
    ProviderUnavailableError,
)


def settings(api_key: str | None = "test-key", rate_limit: int = 5) -> Settings:
    return Settings(
        api_key=api_key,
        model="gemini-flash-latest",
        cors_origins=["http://localhost:5173"],
        host="127.0.0.1",
        port=8000,
        provider_timeout_seconds=1,
        max_concurrent_analyses=2,
        rate_limit_requests=rate_limit,
        rate_limit_window_seconds=60,
    )


class FakeProvider:
    def __init__(self, response: ProcessAnalysisResponse | None = None, error=None):
        self.response = response or ProcessAnalysisResponse.model_validate(
            {
                "summary": "Invoices are manually reviewed.",
                "inefficiencies": ["Repeated manual checks."],
                "suggestions": [
                    {
                        "title": "Automate validation",
                        "description": "Apply rules to catch common issues.",
                        "complexity": "medium",
                        "priority": "high",
                    },
                    {
                        "title": "Review later steps",
                        "description": "Measure the remaining handoffs.",
                        "complexity": "low",
                        "priority": "low",
                    },
                ],
            }
        )
        self.error = error

    async def analyse(self, process_description: str) -> ProcessAnalysisResponse:
        if self.error:
            raise self.error
        return self.response

    async def check_health(self) -> bool:
        return self.error is None


class ProcessApiTests(unittest.TestCase):
    def test_analysis_returns_prioritized_structured_response(self):
        client = TestClient(create_app(settings(), FakeProvider()))
        response = client.post("/analyse", json={"process_description": "Review invoices"})

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["summary"], "Invoices are manually reviewed.")
        self.assertEqual(body["suggestions"][0]["priority"], "high")
        self.assertEqual(body["suggestions"][1]["priority"], "low")
        self.assertEqual(body["suggestions"][0]["complexity"], "medium")

    def test_invalid_input_is_rejected_before_provider_call(self):
        provider = FakeProvider()
        client = TestClient(create_app(settings(), provider))
        response = client.post("/analyse", json={"process_description": "   "})

        self.assertEqual(response.status_code, 422)

    def test_unconfigured_provider_has_actionable_but_safe_message(self):
        client = TestClient(create_app(settings(api_key=None), FakeProvider(error=ProviderConfigurationError())))
        response = client.post("/analyse", json={"process_description": "Review invoices"})

        self.assertEqual(response.status_code, 503)
        self.assertIn("administrator", response.json()["detail"])
        self.assertNotIn("GEMINI_API_KEY", response.json()["detail"])

    def test_provider_timeout_maps_to_gateway_timeout(self):
        client = TestClient(create_app(settings(), FakeProvider(error=ProviderTimeoutError())))
        response = client.post("/analyse", json={"process_description": "Review invoices"})

        self.assertEqual(response.status_code, 504)
        self.assertIn("too long", response.json()["detail"])

    def test_provider_overload_maps_to_retryable_service_unavailable(self):
        client = TestClient(create_app(settings(), FakeProvider(error=ProviderOverloadedError())))
        response = client.post("/analyse", json={"process_description": "Review invoices"})

        self.assertEqual(response.status_code, 503)
        self.assertIn("Gemini is temporarily busy", response.json()["detail"])
        self.assertEqual(response.headers["retry-after"], "10")

    def test_provider_failure_maps_to_safe_upstream_error(self):
        client = TestClient(create_app(settings(), FakeProvider(error=ProviderUnavailableError())))
        response = client.post("/analyse", json={"process_description": "Review invoices"})

        self.assertEqual(response.status_code, 502)
        self.assertIn("temporarily unavailable", response.json()["detail"])

    def test_health_and_readiness_are_distinct(self):
        client = TestClient(create_app(settings(api_key=None), FakeProvider()))

        self.assertEqual(client.get("/health").status_code, 200)
        self.assertEqual(client.get("/ready").status_code, 503)

    def test_rate_limit_returns_retry_after(self):
        client = TestClient(create_app(settings(rate_limit=1), FakeProvider()))
        payload = {"process_description": "Review invoices"}

        self.assertEqual(client.post("/analyse", json=payload).status_code, 200)
        response = client.post("/analyse", json=payload)
        self.assertEqual(response.status_code, 429)
        self.assertEqual(response.headers["retry-after"], "60")


if __name__ == "__main__":
    unittest.main()