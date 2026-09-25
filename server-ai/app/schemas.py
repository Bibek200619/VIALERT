"""Validated request and response contracts for the mock prediction API."""

import json
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


Congestion = Literal["low", "medium", "high"]
Weather = Literal["clear", "rain", "heavy-rain"]
NODES_PATH = Path(__file__).resolve().parents[2] / "shared-data" / "nodes.json"
AREA_IDS = frozenset(node["id"] for node in json.loads(NODES_PATH.read_text()))
ROADS_PATH = Path(__file__).resolve().parents[2] / "shared-data" / "roads.json"
ROAD_IDS = frozenset(road["id"] for road in json.loads(ROADS_PATH.read_text()))


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


IncidentType = Literal["accident", "construction", "flood", "congestion", "blockage"]


class ForecastInput(BaseModel):
    """Explicit demo assumptions for a 30 minute graph-road forecast."""

    model_config = ConfigDict(extra="forbid", strict=True)

    areaId: str
    roadId: str
    timeOfDay: str = Field(pattern=r"^([01][0-9]|2[0-3]):[0-5][0-9]$")
    dayType: Literal["weekday", "weekend"]
    weather: Weather
    rainIntensity: Literal["none", "light", "moderate", "heavy"]
    isHoliday: bool
    officePeak: bool
    schoolPeak: bool
    activeIncidents: list[IncidentType]
    roadConstruction: bool = False
    floodRisk: bool = False
    currentCongestion: Congestion
    eventNearby: bool
    emergencyPriorityActive: bool

    @field_validator("areaId")
    @classmethod
    def validate_forecast_area(cls, value: str) -> str:
        if value not in AREA_IDS:
            raise ValueError("areaId must match an ID in shared-data/nodes.json")
        return value

    @field_validator("roadId")
    @classmethod
    def validate_road(cls, value: str) -> str:
        if value not in ROAD_IDS:
            raise ValueError("roadId must match an ID in shared-data/roads.json")
        return value


class Forecast(BaseModel):
    areaId: str
    roadId: str
    predictedCongestion: Literal["low", "medium", "high", "severe"]
    riskScore: int = Field(ge=0, le=100)
    etaImpactMinutes: int = Field(ge=0)
    confidence: Literal["low", "medium", "high"]
    predictionWindow: str
    factors: list[str]
    operatorRecommendation: str
    routingRecommendation: str
    disclaimer: str = "Demo-only heuristic prediction using mock city data, not a live traffic forecast."
    demo: Literal[True] = True
    model: Literal["explainable-rules-v1"] = "explainable-rules-v1"


class ForecastBatchInput(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    requests: list[ForecastInput] = Field(min_length=1, max_length=24)


class ForecastBatch(BaseModel):
    demo: Literal[True] = True
    model: Literal["explainable-rules-v1"] = "explainable-rules-v1"
    predictions: list[Forecast]
