# Backend API Specification

The Node service is a local mock API with in-memory state. All responses include
`demo: true`; no endpoint dispatches an ambulance, changes a real signal, reads
live traffic, or persists records. Existing Phase 1 routes and response shapes
remain available alongside the Phase 3 simulation/incident routes.

## Node.js API

| Method | Path | Behavior |
| --- | --- | --- |
| `GET` | `/api/health` | Health check; keeps the existing `{status, service, phase, demo}` response |
| `GET` | `/api/city` | Shared nodes, roads, signals, hospitals, bases, adjacency, and scenario presets |
| `GET` | `/api/emergencies` | In-memory pending demo emergencies |
| `POST` | `/api/emergencies` | Add a mock pending emergency; does not calculate its route |
| `PATCH` | `/api/signals/:signalId` | Update mock signal state and/or mode |
| `POST` | `/api/incidents` | Add an in-memory road incident and recompute mock road overlays |
| `DELETE` | `/api/incidents/:incidentId` | Remove an incident and recompute road overlays from baseline plus remaining incidents |
| `GET` | `/api/simulation/state` | Read mock status, incident count, and `demo` flag |
| `POST` | `/api/simulation/start` | Mark mock simulation status as running |
| `POST` | `/api/simulation/pause` | Mark mock status paused (a ready service stays ready) |
| `POST` | `/api/simulation/reset` | Clear emergencies/incidents/status and restore fixture roads/signals |

### Create an incident

`POST /api/incidents` accepts JSON with all four fields:

```json
{"roadId":"R4","type":"accident","severity":"high","blocked":false}
```

Valid types: `accident`, `construction`, `rain`, `heavy-rain` (legacy alias),
`flood`, `congestion`, `blockage`. Severity is `low`, `medium`, or `high`;
`blocked` is a boolean. The response is `{incident, demo:true}` with a generated
ID and creation time. Deleting the incident returns `{incident, demo:true}`.
Incident updates are independent of the browser simulation engine's road-cost
model; they provide a simple mock backend record/road overlay.

### Simulation status

State responses are shaped like:

```json
{"simulation":{"status":"running","simulationTimeSeconds":0,"incidentCount":0,"demo":true},"demo":true}
```

The Node service does not own browser simulation time or movement. There is no
tick endpoint, database, persistence, or WebSocket delivery in Phase 3. When
the API is unavailable, the browser uses the shared city fixtures and still
runs the local simulation.

## Python FastAPI

FastAPI exposes `GET /health`, `POST /predict-traffic`, and `GET /predictions`.
Predictions are deterministic demo rules with heuristic confidence, not a
trained or calibrated model. See the [AI contract and rules](../server-ai/README.md).

## Errors and development

Malformed JSON and invalid fields return 400; unknown entity IDs return 404;
duplicate ambulance emergencies return 409. Errors use
`{error:{code,message},demo:true}`. Request bodies are limited to 32 KB, and
state-changing JSON requests require `Content-Type: application/json`. For
startup, environment variables, and the existing emergency/signal examples,
see the [Node API README](../server-node/README.md).
