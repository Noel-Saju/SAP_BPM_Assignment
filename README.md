# Process Improvement Agent — Technical Assessment

> **Confidential.** This assignment and all of its contents are proprietary and
> provided solely for completing this interview. Do not share, publish, or
> redistribute it to anyone. See [LICENSE](./LICENSE) for the full terms.

## Overview

This is a full-stack application that allows a user to describe a business process and receive AI-powered improvement suggestions. It consists of a React + TypeScript frontend and a Python + FastAPI backend powered by Google Gemini.

## Expected Behaviour

When working correctly, the application should:

1. Accept a business process description from the user via a text input.
2. Send it to the backend, which runs an AI agent to analyse the process.
3. Return a structured response containing:
   - A summary of the process
   - A list of identified inefficiencies or risks
   - Prioritised improvement suggestions, each with a title, description, and complexity rating (low / medium / high)
4. Display the results in a clear, readable, structured format in the UI.

## Your Task

This project contains **intentional issues**. Your job is to:

1. Get the application running locally.
2. Identify the issues — in architecture, code quality, robustness, and user experience.
3. Fix them.

No list of issues is provided. Finding them is part of the exercise.

You are free to refactor, restructure, and improve the code however you see fit. The only constraint is that the application must still fulfil the expected behaviour described above.

## Setup

### Prerequisites

- Node.js 18+
- Python 3.13 (3.14 not yet supported)
- A Gemini API key (free tier: [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey))

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp env.example .env        # Then add your GEMINI_API_KEY
python run.py
```

The backend runs on `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`.

## Submission

When you are done, make sure:

- The application runs with the two commands above (backend + frontend).
- Your changes are committed with clear commit messages.
- You have added a short section below titled **"Changes Made"** documenting what you found and fixed, and why.

---

## Changes Made

- Added backend request validation and schema validation for Gemini responses, with clear handling for missing API configuration and provider failures.
- Made the Gemini model, CORS origins, and frontend API URL configurable through environment variables; added safe example environment files.
- Replaced raw JSON output with typed, accessible sections for the summary, risks, and complexity-rated suggestions; improved loading, error, input-limit, and privacy messaging.
- Added backend unit tests for input validation and successful, missing-key, and malformed-response cases.
