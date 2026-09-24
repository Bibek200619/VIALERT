import pytest
from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)
VALID_INPUT = {
    "areaId": "SILK-BOARD",
    "hour": 18,
    "weather": "heavy-rain",
    "weekday": True,
    "officeHours": True,
    "baselineCongestion": "medium",
}


def test_health_identifies_phase_and_demo():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {
        "status": "ok", "service": "vialert-ai", "phase": 1, "demo": True
    }


def test_predictions_are_deterministic_and_explained():
    first = client.post("/predict-traffic", json=VALID_INPUT)
    second = client.post("/predict-traffic", json=VALID_INPUT)
    assert first.status_code == 200
    assert first.json() == second.json() == {
        "areaId": "SILK-BOARD",
        "predictedCongestion": "high",
        "timeWindow": "18:00-19:00",
        "confidence": 0.6,
        "reason": "baseline medium + weekday office commute + heavy rain",
        "demo": True,
        "model": "rule-based-demo",
        "confidenceKind": "heuristic",
    }


@pytest.mark.parametrize(
    ("field", "invalid"),
    [
        ("areaId", "UNKNOWN-AREA"),
        ("areaId", ""),
        ("hour", -1),
        ("hour", 24),
        ("hour", 12.5),
        ("hour", "18"),
        ("hour", True),
        ("weather", "snow"),
        ("weekday", "true"),
        ("officeHours", 1),
        ("baselineCongestion", "extreme"),
    ],
)
def test_invalid_input_is_rejected(field, invalid):
    assert client.post("/predict-traffic", json={**VALID_INPUT, field: invalid}).status_code == 422


@pytest.mark.parametrize("field", VALID_INPUT)
def test_required_fields_are_not_silently_assumed(field):
    payload = {key: value for key, value in VALID_INPUT.items() if key != field}
    assert client.post("/predict-traffic", json=payload).status_code == 422


def test_unknown_fields_are_rejected():
    response = client.post("/predict-traffic", json={**VALID_INPUT, "liveTraffic": True})
    assert response.status_code == 422


@pytest.mark.parametrize("hour, window", [(0, "00:00-01:00"), (23, "23:00-00:00")])
def test_day_boundary_windows(hour, window):
    response = client.post("/predict-traffic", json={**VALID_INPUT, "hour": hour})
    assert response.status_code == 200
    assert response.json()["timeWindow"] == window


def test_commute_and_rain_effects_and_weekend_behavior():
    quiet = {**VALID_INPUT, "baselineCongestion": "low", "weather": "clear", "hour": 12}
    commute = {**quiet, "hour": 18}
    wet_commute = {**commute, "weather": "heavy-rain"}
    weekend = {**commute, "weekday": False}
    no_office_activity = {**commute, "officeHours": False}
    for payload, expected in [
        (quiet, "low"),
        (commute, "medium"),
        (wet_commute, "high"),
        (weekend, "low"),
        (no_office_activity, "low"),
    ]:
        assert client.post("/predict-traffic", json=payload).json()["predictedCongestion"] == expected


def test_sample_predictions_are_stable_and_post_does_not_persist():
    before = client.get("/predictions")
    assert before.status_code == 200
    body = before.json()
    assert body["demo"] is True
    assert body["model"] == "rule-based-demo"
    assert [prediction["predictedCongestion"] for prediction in body["predictions"]] == [
        "low", "medium", "high"
    ]
    assert all(prediction["confidenceKind"] == "heuristic" for prediction in body["predictions"])
    client.post("/predict-traffic", json=VALID_INPUT)
    assert client.get("/predictions").json() == body


def test_frontend_origin_can_read_health():
    response = client.get("/health", headers={"Origin": "http://localhost:5173"})
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
