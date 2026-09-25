# VIALERT heuristic prediction service — Phase 6

This FastAPI service returns deterministic, explainable demo forecasts. It has no
trained model, live traffic input, database, or measured prediction accuracy.

## Local development

From the repository root, with Python 3.11+ and [uv](https://docs.astral.sh/uv/) installed:

```bash
uv sync --project server-ai --locked
uv run --project server-ai uvicorn app.main:app --app-dir server-ai --reload --host 127.0.0.1 --port 8000
```

Open `http://127.0.0.1:8000/docs` for interactive API documentation. Run the checks with:

```bash
uv run --project server-ai pytest server-ai/tests
```

The default browser origins are `http://localhost:5173` and `http://127.0.0.1:5173`.
Set `CORS_ORIGINS` to a comma-separated list to override them. The service does not
need secrets or external traffic APIs. Data paths resolve from the source files,
independently of the shell's working directory.

## API contract

- `GET /health`: `{ "status": "ok", "service": "vialert-ai", "phase": 1, "demo": true }`.
- `POST /predict-traffic`: predict one demo area from the inputs below.
- `GET /predictions`: `{ "demo": true, "model": "rule-based-demo", "predictions": [...] }`,
  computed from `app/sample_data/prediction_inputs.json`. POST requests do not
  modify this list or store any state.
- `POST /predict/forecast`: one factor-rich 30-minute graph-road forecast.
- `POST /predict/batch`: `{ "requests": [ForecastInput, ...] }` for 1–24 roads;
  returns `{ "demo": true, "model": "explainable-rules-v1", "predictions": [...] }`.

The original Phase 1 routes, response shapes, and sample data remain unchanged.

### Phase 6 forecast example

```json
{
  "areaId": "SILK-BOARD", "roadId": "R5", "timeOfDay": "18:00",
  "dayType": "weekday", "weather": "rain", "rainIntensity": "heavy",
  "isHoliday": false, "officePeak": true, "schoolPeak": false,
  "activeIncidents": ["accident"], "roadConstruction": false,
  "floodRisk": false, "currentCongestion": "high",
  "eventNearby": false, "emergencyPriorityActive": false
}
```

`areaId` and `roadId` must exist in the shared node/road graph; `timeOfDay`
must be `HH:MM` in 24-hour form. Enums and booleans are strict. Missing or
invalid fields and unknown fields return HTTP 422. A successful response
includes `predictedCongestion` (`low`, `medium`, `high`, `severe`), `riskScore`
(0–100), `etaImpactMinutes`, `confidence` (`low`, `medium`, `high`),
`predictionWindow`, all `factors`, operator and routing recommendations,
`demo: true`, and a demo disclaimer. Confidence is a factor-count label, **not**
a calibrated probability. The 0–100 risk is an ordinal demo score, not a
measured probability of congestion.

The score starts with current-congestion weight 8/24/45 plus area weight
(Silk Board 15, Koramangala 8, Electronic City 7, MG Road and Whitefield 6,
Indiranagar 4). Weekday office peak adds 16; school travel adds 7; holiday
subtracts 8; light/moderate/heavy rain adds 6/11/18. Active accident,
construction, flood, congestion, and blockage add 24/14/35/14/30;
independent construction and flood-risk flags add 14/16 if not already listed
as incidents; a nearby event adds 16. Scores are clamped to 0–100 and
classified low (<25), medium (25–49), high (50–74), severe (75+). ETA area
impact is a deliberately coarse score-derived estimate; emergency-priority
signals reduce that estimate by one minute but do not hide the risk. The
forecast window is 30 demo minutes from `timeOfDay` and wraps at midnight.

The frontend batches six inputs in `shared-data/prediction_inputs.json`
through Vite's `/ai` proxy. When FastAPI is unavailable, a TypeScript mirror
uses the same rules and visibly says **Local rule fallback**. It is still
heuristic. Neither implementation contacts a live traffic feed.

Example request:

```json
{
  "areaId": "SILK-BOARD",
  "hour": 18,
  "weather": "heavy-rain",
  "weekday": true,
  "officeHours": true,
  "baselineCongestion": "medium"
}
```

All six fields are required. `areaId` must match an ID in `shared-data/nodes.json`;
`hour` must be an integer from 0 to 23; `weather` must be `clear`, `rain`, or
`heavy-rain`; `weekday` and `officeHours` must be JSON booleans; and
`baselineCongestion` must be `low`, `medium`, or `high`. Unknown fields, missing
fields, and invalid values return HTTP 422.

Example response:

```json
{
  "areaId": "SILK-BOARD",
  "predictedCongestion": "high",
  "timeWindow": "18:00-19:00",
  "confidence": 0.6,
  "reason": "baseline medium + weekday office commute + heavy rain",
  "demo": true,
  "model": "rule-based-demo",
  "confidenceKind": "heuristic"
}
```

The selected `hour` is the start of the prediction window, in demo Bengaluru local
time; the one-hour window wraps from `23:00` to `00:00`. No current time is used.
The score starts at 0 / 2 / 4 for low / medium / high baseline congestion. Add 2
when both weekday and office-hours flags are true during hours 8–10 or 17–19;
add 1 for rain or 2 for heavy rain. A score below 2 is low, 2–3 is medium, and 4+
is high. Every contributing factor appears in `reason`. The fixed confidence
value of 0.6 is a placeholder heuristic, not a calibrated probability or a claim
of 60% accuracy.
