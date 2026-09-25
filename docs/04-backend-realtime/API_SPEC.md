# Backend API Specification

The Node service is a local mock API with in-memory state. All responses include
`demo: true`; no endpoint dispatches an ambulance, changes a real signal, reads
live traffic, or persists records. Existing Phase 1 routes and response shapes
remain available alongside the Phase 3 simulation/incident and Phase 4 operator routes.
Phase 5 reuses these mock incident endpoints for dynamic browser-side routing;
Phase 6 uses their mock state as prediction factors. Neither adds a database
or production route service.

## Node.js API

| Method | Path | Behavior |
| --- | --- | --- |
| `GET` | `/api/health` | Health check; keeps the existing `{status, service, phase, demo}` response |
| `GET` | `/api/city` | Shared nodes, roads, signals, hospitals, bases, adjacency, and scenario presets |
| `GET` | `/api/emergencies` | In-memory pending demo emergencies |
| `GET` | `/api/vehicles` | Two editable fixture vehicles; Node does not advance locations |
| `GET` | `/api/signals` | Current in-memory mock signal states |
| `GET` | `/api/incidents` | Current in-memory incident records |
| `GET` | `/api/alerts` | In-memory operator alerts |
| `PATCH` | `/api/alerts/:alertId` | Acknowledge a mock alert with `{ "acknowledged": true }` |
| `GET` | `/api/operations/events` | In-memory signal, incident, and acknowledgement actions |
| `GET` | `/api/operations/summary` | Mock fleet, priority signal, incident, and alert counts |
| `POST` | `/api/emergencies` | Add a mock pending emergency; does not calculate its route |
| `PATCH` | `/api/signals/:signalId` | Update mock signal state and/or mode |
| `POST` | `/api/incidents` | Add an in-memory road incident and recompute mock road overlays |
| `DELETE` | `/api/incidents/:incidentId` | Remove an incident and recompute road overlays from baseline plus remaining incidents |
| `GET` | `/api/simulation/state` | Read mock status, incident count, and `demo` flag |
| `POST` | `/api/simulation/start` | Mark mock simulation status as running |
| `POST` | `/api/simulation/pause` | Mark mock status paused (a ready service stays ready) |
| `POST` | `/api/simulation/reset` | Clear emergencies/incidents/status and restore fixture roads/signals |

Phase 4 responses use `{vehicles|signals|incidents|alerts|events|summary, demo:true}`.
The signal PATCH accepts `state` (`red`, `yellow`, `green`) and/or `mode`
(`normal`, `manual`, `emergency`). The browser requires a confirmation step
before sending emergency mode. The Node API remains a demo API; it has no
operator authentication or physical light connection. Incident creation and
priority-mode changes add mock alerts/events. `POST /api/simulation/reset` also
clears these in-memory operator records. The traffic page overlays a Phase 3
snapshot from same-browser local storage for moving ambulance location, ETA,
route, and event history; Node does not own that tick loop.

### Create an incident

`POST /api/incidents` accepts JSON with four required fields and an optional
mock source (`origin` is `operator` by default, or `simulation`):

```json
{"roadId":"R4","type":"accident","severity":"high","blocked":false,"origin":"operator"}
```

Valid types: `accident`, `construction`, `rain`, `heavy-rain` (legacy alias),
`flood`, `congestion`, `blockage`. Severity is `low`, `medium`, or `high`;
`blocked` is a boolean. The response is `{incident, demo:true}` with a generated
ID, creation time, and origin. Deleting the incident returns
`{incident,demo:true}` and acknowledges its associated mock incident alert.
Flood and blockage records are always treated as closures even if `blocked`
was sent as false. The Phase 5 frontend polls operator-origin records and
applies their costs through the shared A* demo model; simulation-origin records
are excluded from that external feed to avoid applying the same scenario twice.
The Node road overlay remains in memory and is not a live traffic source. No
server-side route mutation endpoint is required: each browser recalculates from
the same fixture graph and mock incident feed, with local fallback when offline.

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

FastAPI preserves `GET /health`, `POST /predict-traffic`, and `GET /predictions`.
Phase 6 adds `POST /predict/forecast` for one graph road and `POST /predict/batch`
for 1–24 requests under `{ "requests": [...] }`. Responses include 0–100 risk,
low/medium/high/severe congestion, a 30-minute window, ETA impact estimate,
confidence label, every contributing factor, recommendations, and a demo
disclaimer. Validation errors return 422. Vite proxies browser `/ai/*` requests
to FastAPI; Node does not proxy predictions. The browser uses an explicitly
labeled local heuristic fallback when FastAPI is offline. See the
[AI contract and rules](../../backend/server-ai/README.md). These are mock rules, not
trained or calibrated forecasts.

## Errors and development

Malformed JSON and invalid fields return 400; unknown entity IDs return 404;
duplicate ambulance emergencies return 409. Errors use
`{error:{code,message},demo:true}`. Request bodies are limited to 32 KB, and
state-changing JSON requests require `Content-Type: application/json`. For
startup, environment variables, and the existing emergency/signal examples,
see the [Node API README](../../backend/server-node/README.md).
