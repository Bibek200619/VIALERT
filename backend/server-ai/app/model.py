"""Small deterministic demo rules; this module does not train or run an AI model."""

from .schemas import Forecast, ForecastInput, Prediction, PredictionInput


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


AREA_BASELINE = {
    "SILK-BOARD": 15,
    "KORAMANGALA": 8,
    "MG-ROAD": 6,
    "INDIRANAGAR": 4,
    "ELECTRONIC-CITY": 7,
    "WHITEFIELD": 6,
}


def area_name(area_id: str) -> str:
    return "MG Road" if area_id == "MG-ROAD" else area_id.replace("-", " ").title()


def calculate_risk_score(features: ForecastInput) -> tuple[int, list[str]]:
    score = {"low": 8, "medium": 24, "high": 45}[features.currentCongestion]
    factors = [f"{features.currentCongestion} current congestion"]
    area_baseline = AREA_BASELINE.get(features.areaId, 3)
    score += area_baseline
    factors.append(f"{area_name(features.areaId)} corridor baseline")

    if features.officePeak and features.dayType == "weekday" and not features.isHoliday:
        score += 16
        factors.append("weekday office peak")
    if features.schoolPeak and not features.isHoliday:
        score += 7
        factors.append("school travel period")
    if features.isHoliday:
        score -= 8
        factors.append("holiday reduces regular commute")

    if features.weather != "clear":
        weather_risk = {"none": 6, "light": 6, "moderate": 11, "heavy": 18}[features.rainIntensity]
        score += weather_risk
        factors.append(f"{features.rainIntensity if features.rainIntensity != 'none' else 'light'} rain")

    for incident in sorted(set(features.activeIncidents)):
        penalty = {"accident": 24, "construction": 14, "flood": 35, "congestion": 14, "blockage": 30}[incident]
        score += penalty
        factors.append(f"active {incident}")
    if features.roadConstruction and "construction" not in features.activeIncidents:
        score += 14
        factors.append("road construction")
    if features.floodRisk and "flood" not in features.activeIncidents:
        score += 16
        factors.append("flood risk")
    if features.eventNearby:
        score += 16
        factors.append("nearby event or festival")
    return max(0, min(100, score)), factors


def classify_congestion(score: int) -> str:
    return "severe" if score >= 75 else "high" if score >= 50 else "medium" if score >= 25 else "low"


def predict_forecast(features: ForecastInput) -> Forecast:
    score, factors = calculate_risk_score(features)
    level = classify_congestion(score)
    impact = max(0, int((score - 15) / 10 + 0.5))
    if features.emergencyPriorityActive and impact > 0:
        impact -= 1
        factors.append("emergency signal priority reduces ETA impact")
    start_hour, start_minute = map(int, features.timeOfDay.split(":"))
    end_minutes = (start_hour * 60 + start_minute + 30) % (24 * 60)
    window = f"{features.timeOfDay}–{end_minutes // 60:02d}:{end_minutes % 60:02d}"
    confidence = "high" if len(factors) >= 6 else "medium" if len(factors) >= 3 else "low"
    area = area_name(features.areaId)
    return Forecast(
        areaId=features.areaId,
        roadId=features.roadId,
        predictedCongestion=level,
        riskScore=score,
        etaImpactMinutes=impact,
        confidence=confidence,
        predictionWindow=window,
        factors=factors,
        operatorRecommendation=(
            f"Monitor {area} and prepare simulated signal priority for approaching emergency vehicles."
            if level in {"high", "severe"} else f"Continue monitoring {area}; no pre-action is needed in this demo."
        ),
        routingRecommendation=(
            f"Apply a forecast penalty to {features.roadId}; prefer an alternate corridor if it is safer."
            if level in {"high", "severe"} else f"Keep {features.roadId} available; monitor the next forecast window."
        ),
    )
