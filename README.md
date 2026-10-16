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

- Node.js 22.12+
- Python 3.13 (3.14 not yet supported)
- A Gemini API key (free tier: [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey))

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp -n env.example .env     # Then add your GEMINI_API_KEY;
python run.py
```

The backend runs on `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

The frontend runs on `http://localhost:5173`.

The frontend and backend require explicit environment configuration. Set `VITE_API_BASE_URL` in `frontend/.env.local` and `CORS_ORIGINS` in `backend/.env` to the exact frontend origin. If `backend/.env` already exists, add the settings from `backend/env.example` without replacing your API key. The backend binds to `127.0.0.1` by default. Do not expose it publicly without authentication, TLS, and appropriate proxy/network controls. Analysis descriptions are sent to Google Gemini; do not submit confidential, personal, or otherwise sensitive information. The in-memory rate limit applies per backend process and is intended for local/single-instance use, not as a distributed production limit.

`/health` is a liveness check; `/ready` reports whether the model provider is configured (it does not make a billable provider call). Provider requests have bounded retries, a timeout, a concurrency cap, and a per-client request limit. If Gemini temporarily overloads the configured model, the backend tries the models listed in `GEMINI_FALLBACK_MODELS` before returning a retryable service-unavailable response. The frontend supports canceling requests and validates the response schema before rendering.

### Tests

```bash
cd backend
venv/bin/python -m unittest discover -s tests

cd ../frontend
npm test
npm run build
npm audit
```

## Submission

When you are done, make sure:

- The application runs with the two commands above (backend + frontend).
- Your changes are committed with clear commit messages.
- You have added a short section below titled **"Changes Made"** documenting what you found and fixed, and why.

---

## Changes Made

- Reworked backend validation and provider architecture by adding typed request/response schemas, an injectable provider interface, and schema-constrained Google Gen AI output. This prevents malformed input/model output from silently propagating and makes provider behavior easier to test or replace.
- Added bounded retries, configurable deadlines, fallback Gemini models, concurrency limits, per-client rate limiting, and actionable provider errors because upstream overloads and slow requests previously surfaced as generic gateway failures and could consume backend capacity. Separate `/health` and `/ready` endpoints distinguish process liveness from provider configuration.
- Centralized configuration, required explicit frontend API/CORS origins, and bound the development server to loopback by default to avoid hidden environment assumptions and accidental network exposure. Added guidance that descriptions are sent to Gemini so users can avoid submitting sensitive data.
- Added explicit high/medium/low priorities, deterministic ordering, and user-adjustable priority separate from complexity so recommendations are easier to evaluate and tailor to local needs.
- Redesigned the responsive UI to present analysis as readable sections rather than raw data, and improved loading/error states, keyboard navigation, focus visibility, reduced-motion behavior, and screen-reader announcements to make the workflow clearer and more accessible. Added request cancellation, a client timeout, and runtime response validation to handle slow requests and unexpected API payloads safely.
- Added backend API/provider tests and frontend component/client tests to cover the request contract, provider failures, priority handling, cancellation, and response validation. Verified 11 backend tests, 8 frontend tests, a successful production build, and `npm audit` with zero reported vulnerabilities; also confirmed a live sample analysis succeeds with model fallback enabled.
