import asyncio

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.agent import analyse_process

app = FastAPI(title="Process Improvement Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/analyse")
async def analyse(body: dict):
    process_description = body.get("process_description", "")
    try:
        result = await asyncio.to_thread(analyse_process, process_description)
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    return result


@app.get("/health")
async def health():
    return {"status": "ok"}
