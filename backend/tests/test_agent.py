import json
import os
import unittest
from types import SimpleNamespace
from unittest.mock import patch

from pydantic import ValidationError

from app.agent import analyse_process
from app.models import ProcessAnalysisResponse, ProcessInput


class ProcessInputTests(unittest.TestCase):
    def test_description_is_trimmed(self):
        request = ProcessInput(process_description="  Review invoices  ")
        self.assertEqual(request.process_description, "Review invoices")

    def test_blank_description_is_rejected(self):
        with self.assertRaises(ValidationError):
            ProcessInput(process_description="   ")

    def test_oversized_description_is_rejected(self):
        with self.assertRaises(ValidationError):
            ProcessInput(process_description="x" * 10001)


class AnalyseProcessTests(unittest.TestCase):
    def test_valid_json_is_returned_as_validated_response(self):
        payload = {
            "summary": "Invoices are reviewed manually.",
            "inefficiencies": ["Manual review takes time."],
            "suggestions": [
                {
                    "title": "Automate checks",
                    "description": "Use rules to flag common issues.",
                    "complexity": "medium",
                }
            ],
        }
        model = SimpleNamespace(
            generate_content=unittest.mock.Mock(
                return_value=SimpleNamespace(text=json.dumps(payload))
            )
        )
        with (
            patch.dict(os.environ, {"GEMINI_API_KEY": "test-key"}),
            patch("app.agent.genai.configure"),
            patch("app.agent.genai.GenerativeModel", return_value=model),
        ):
            result = analyse_process("Review invoices")

        self.assertIsInstance(result, ProcessAnalysisResponse)
        self.assertEqual(result.suggestions[0].complexity.value, "medium")
        model.generate_content.assert_called_once()

    def test_missing_api_key_fails_before_provider_call(self):
        with (
            patch.dict(os.environ, {}, clear=True),
            patch("app.agent.genai.GenerativeModel") as model,
        ):
            with self.assertRaisesRegex(ValueError, "GEMINI_API_KEY"):
                analyse_process("Review invoices")
        model.assert_not_called()

    def test_malformed_json_is_rejected(self):
        model = SimpleNamespace(
            generate_content=unittest.mock.Mock(
                return_value=SimpleNamespace(text="not json")
            )
        )
        with (
            patch.dict(os.environ, {"GEMINI_API_KEY": "test-key"}),
            patch("app.agent.genai.configure"),
            patch("app.agent.genai.GenerativeModel", return_value=model),
        ):
            with self.assertRaisesRegex(ValueError, "invalid analysis response"):
                analyse_process("Review invoices")


if __name__ == "__main__":
    unittest.main()