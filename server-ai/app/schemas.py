"""Validated request and response contracts for the mock prediction API."""

import json
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


Congestion = Literal["low", "medium", "high"]
Weather = Literal["clear", "rain", "heavy-rain"]
NODES_PATH = Path(__file__).resolve().parents[2] / "shared-data" / "nodes.json"
AREA_IDS = frozenset(node["id"] for node in json.loads(NODES_PATH.read_text()))


class PredictionInput(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    areaId: str = Field(description="Node ID from shared-data/nodes.json")
    hour: int = Field(ge=0, le=23, description="Start hour in Bengaluru local demo time")
    weather: Weather
    weekday: bool
    officeHours: bool
    baselineCongestion: Congestion

    @field_validator("areaId")
    @classmethod
    def validate_area(cls, value: str) -> str:
        if value not in AREA_IDS:
            raise ValueError("areaId must match an ID in shared-data/nodes.json")
        return value


class Prediction(BaseModel):
    areaId: str
    predictedCongestion: Congestion
    timeWindow: str
    confidence: Literal[0.6] = Field(
        default=0.6,
        description="Fixed demo heuristic; not measured accuracy or a calibrated probability",
    )
    reason: str
    demo: Literal[True] = True
    model: Literal["rule-based-demo"] = "rule-based-demo"
    confidenceKind: Literal["heuristic"] = "heuristic"


class PredictionList(BaseModel):
    demo: Literal[True] = True
    model: Literal["rule-based-demo"] = "rule-based-demo"
    predictions: list[Prediction]
