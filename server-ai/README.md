# VIALERT mock prediction service — Phase 1

This FastAPI service returns deterministic, rule-based demo predictions. It has no
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
