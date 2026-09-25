"""Phase 6 deterministic forecast and request validation tests."""

import json
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)
EXAMPLES_PATH = Path(__file__).resolve().parents[2] / "shared-data" / "prediction_inputs.json"
EXAMPLES = json.loads(EXAMPLES_PATH.read_text())
BASE = EXAMPLES[1]


def forecast(**changes):
    response = client.post("/predict/forecast", json={**BASE, **changes})
    assert response.status_code == 200
    return response.json()


def test_office_peak_and_rain_raise_risk():
    quiet = forecast(officePeak=False, weather="clear", rainIntensity="none")
    peak = forecast(officePeak=True, weather="clear", rainIntensity="none")
    wet = forecast(officePeak=True, weather="rain", rainIntensity="heavy")
    assert quiet["riskScore"] < peak["riskScore"] < wet["riskScore"]
    assert "weekday office peak" in peak["factors"]
    assert "heavy rain" in wet["factors"]


def test_accident_and_flood_can_make_forecast_severe():
    accident = forecast(activeIncidents=["accident"], weather="rain", rainIntensity="heavy")
    flood = forecast(activeIncidents=["flood"])
    assert accident["predictedCongestion"] == "severe"
    assert flood["predictedCongestion"] == "severe"
    assert "active flood" in flood["factors"]
    assert flood["riskScore"] <= 100


def test_priority_reduces_eta_without_hiding_road_risk():
    normal = forecast(activeIncidents=["accident"])
    priority = forecast(activeIncidents=["accident"], emergencyPriorityActive=True)
    assert normal["riskScore"] == priority["riskScore"]
    assert normal["etaImpactMinutes"] - priority["etaImpactMinutes"] == 1
    assert any("priority" in factor for factor in priority["factors"])


def test_batch_returns_six_graph_areas_and_matches_single_endpoint():
    response = client.post("/predict/batch", json={"requests": EXAMPLES})
    assert response.status_code == 200
    predictions = response.json()["predictions"]
    assert len(predictions) == 6
    assert len({item["areaId"] for item in predictions}) == 6
    assert predictions[0] == client.post("/predict/forecast", json=EXAMPLES[0]).json()
    assert predictions[0]["predictedCongestion"] == "severe"
    assert all(item["disclaimer"].startswith("Demo-only") for item in predictions)


def test_invalid_inputs_receive_422_with_field_detail():
    invalid_cases = [
        {"timeOfDay": "25:00"}, {"roadId": "R999"}, {"areaId": "HEBBAL"},
        {"currentCongestion": "severe"}, {"activeIncidents": ["unknown"]},
        {"officePeak": "true"},
    ]
    for changed in invalid_cases:
        response = client.post("/predict/forecast", json={**BASE, **changed})
        assert response.status_code == 422
        assert response.json()["detail"]
    assert client.post("/predict/batch", json={"requests": []}).status_code == 422
