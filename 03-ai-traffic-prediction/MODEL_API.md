# Prediction API

The live Phase 6 contract is maintained in [server-ai/README.md](../server-ai/README.md).
The FastAPI explorer is at `http://127.0.0.1:8000/docs` when the local service
is running. The original Phase 1 `POST /predict-traffic` and `GET /predictions`
remain compatible. Phase 6 adds `POST /predict/forecast` and
`POST /predict/batch` with 30-minute, factor-rich heuristic outputs.

There is no `/prediction-context` write endpoint: dashboard demo assumptions
are stored in the browser, and active mock incidents come from existing Node
and simulation state. No external forecast or model-training service is used.
