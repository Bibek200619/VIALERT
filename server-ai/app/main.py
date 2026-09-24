"""HTTP entry point for VIALERT's stateless Phase 1 prediction service."""

import json
import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .model import predict_traffic
from .schemas import Prediction, PredictionInput, PredictionList


app = FastAPI(
    title="VIALERT mock prediction API",
    version="0.1.0",
    description=(
        "Phase 1 foundation. All predictions are deterministic demo rules, "
        "with heuristic confidence and no live traffic or trained model."
    ),
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
        ).split(",")
        if origin.strip()
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

SAMPLE_INPUTS_PATH = Path(__file__).resolve().parent / "sample_data" / "prediction_inputs.json"
SAMPLE_INPUTS = [
    PredictionInput.model_validate(item)
    for item in json.loads(SAMPLE_INPUTS_PATH.read_text())
]


@app.get("/health", tags=["health"])
def health() -> dict:
    return {"status": "ok", "service": "vialert-ai", "phase": 1, "demo": True}


@app.post("/predict-traffic", response_model=Prediction, tags=["mock predictions"])
def predict(features: PredictionInput) -> Prediction:
    return predict_traffic(features)


@app.get("/predictions", response_model=PredictionList, tags=["mock predictions"])
def get_predictions() -> PredictionList:
    return PredictionList(predictions=[predict_traffic(item) for item in SAMPLE_INPUTS])
