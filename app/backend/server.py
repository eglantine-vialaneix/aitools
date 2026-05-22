import os
import sys
from pathlib import Path

os.environ.setdefault("MPLCONFIGDIR", "/tmp/matplotlib")

# Ensure this directory is importable so compute_gini / predict_test can be found.
sys.path.insert(0, str(Path(__file__).parent))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import compute_gini
import predict_test

app = FastAPI(title="aitools backend")

# Allow the Next.js dev server (port 3000) to call us.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)


@app.post("/gini")
def gini(payload: dict):
    try:
        return compute_gini.run(payload)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/predictions")
def predictions(payload: dict):
    try:
        return predict_test.run(payload)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
