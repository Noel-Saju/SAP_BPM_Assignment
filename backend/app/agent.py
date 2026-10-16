import os
import json
import google.generativeai as genai

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

SYSTEM_PROMPT = "You are a helpful assistant. Help users improve their business processes."


def analyse_process(process_description: str) -> dict:
    """Analyse a business process and return improvement suggestions."""

    model = genai.GenerativeModel(
        model_name="gemini-3.6-flash",
        system_instruction=SYSTEM_PROMPT,
    )

    prompt = f"""Analyse the following business process and provide improvement suggestions.

Process description:
{process_description}

Please respond in the following JSON format:
{{
    "summary": "brief summary of what the process does",
    "inefficiencies": ["list", "of", "inefficiencies"],
    "suggestions": [
        {{
            "title": "suggestion title",
            "description": "detailed description of the improvement",
            "complexity": "low or medium or high"
        }}
    ]
}}"""

    response = model.generate_content(prompt)
    text = response.text.strip()

    if "```json" in text:
        text = text.split("```json")[1].split("```")[0].strip()
    elif "```" in text:
        text = text.split("```")[1].split("```")[0].strip()

    try:
        result = json.loads(text)
    except json.JSONDecodeError:
        raise ValueError("Model did not return valid JSON")
    return result
