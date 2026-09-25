# Traffic Prediction Module · Phase 6

VIALERT scores six roads on its hardcoded Bengaluru-inspired graph for likely
congestion over the next 30 demo minutes. This is an **explainable heuristic**,
not trained AI or a live forecast. It uses selected time and weekday/weekend,
office/school peaks, weather/rain intensity, holiday/event flags, current graph
congestion, active scenarios/incidents, construction, flood risk, and simulated
emergency signal priority.

The `/traffic` Prediction desk shows risk badges, factors, recommendations,
the forecast time window, and a dashed risk map layer. `/ambulance` shows
forecast cost and ETA changes when a high/severe predicted road lies on its
route. `/simulation` highlights the forecast associated with an activated
scenario; its deterministic movement engine still uses incident-only costs.

The FastAPI service implements `POST /predict/forecast` and
`POST /predict/batch`; the old `POST /predict-traffic` and `GET /predictions`
remain for compatibility. Inputs are in
[`shared-data/prediction_inputs.json`](../../shared-data/prediction_inputs.json).
See [the exact contract and scoring rules](../../backend/server-ai/README.md) and the
[judge demo flow](../06-project-management/DEMO_SCRIPT.md).

If FastAPI is offline, the browser displays a labeled deterministic local
fallback. High/severe forecasts add an optional 1.15×/1.30× cost to the
Ambulance and Traffic A* demo routes. No real feed, traffic authority,
dispatch system, or trained production ML model is connected. Confidence
labels and area ETA impacts are illustrative, not measured accuracy.
