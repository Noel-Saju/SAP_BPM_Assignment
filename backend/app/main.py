import asyncio
import logging
import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.agent import analyse_process
from app.models import ProcessAnalysisResponse, ProcessInput

logger = logging.getLogger(__name__)

app = FastAPI(title="Process Improvement Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS", "http://localhost:5173"
        ).split(",")
        if origin.strip()
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/analyse", response_model=ProcessAnalysisResponse)
async def analyse(body: ProcessInput) -> ProcessAnalysisResponse:
    try:
        return await asyncio.to_thread(
            analyse_process, body.process_description
        )
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    except Exception as exc:
        logger.exception("Process analysis provider request failed")
        raise HTTPException(
            status_code=502,
            detail="The analysis service could not complete the request.",
        ) from exc


@app.get("/health")
async def health():
    return {"status": "ok"}
