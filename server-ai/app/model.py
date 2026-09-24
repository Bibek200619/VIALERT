"""Small deterministic demo rules; this module does not train or run an AI model."""

from .schemas import Prediction, PredictionInput


def predict_traffic(features: PredictionInput) -> Prediction:
    score = {"low": 0, "medium": 2, "high": 4}[features.baselineCongestion]
    reasons = [f"baseline {features.baselineCongestion}"]

    commute_hour = 8 <= features.hour <= 10 or 17 <= features.hour <= 19
    if features.weekday and features.officeHours and commute_hour:
        score += 2
        reasons.append("weekday office commute")

    if features.weather == "rain":
        score += 1
        reasons.append("rain")
    elif features.weather == "heavy-rain":
        score += 2
        reasons.append("heavy rain")

    congestion = "high" if score >= 4 else "medium" if score >= 2 else "low"
    return Prediction(
        areaId=features.areaId,
        predictedCongestion=congestion,
        timeWindow=f"{features.hour:02d}:00-{(features.hour + 1) % 24:02d}:00",
        reason=" + ".join(reasons),
    )
