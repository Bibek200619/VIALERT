# Node demo API · Phase 4

This is a local, in-memory mock API. It does not dispatch ambulances, control
real signals, track GPS, or run the browser simulation clock. All responses
include `demo: true`; fixture files are never modified.

From the repository root, install workspace dependencies with `npm ci`, then
run `npm run dev:node`. Node.js 22.12+ is required. The API starts at
`http://127.0.0.1:4000`. Run its checks with `npm run test:node`.

Optional settings: copy `server-node/.env.example` to `server-node/.env` and edit
`HOST`, `PORT`, or `CLIENT_ORIGIN`. The default CORS origin is
`http://localhost:5173` and the default host binds locally.

## Contracts

| Endpoint | Status | Response |
| --- | --- | --- |
| `GET /api/health` | 200 | `{status:"ok", service:"vialert-node", phase:1, demo:true}` (kept for compatibility) |
| `GET /api/city` | 200 | `{nodes, roads, signals, hospitals, bases, adjacency, scenarios, vehicles, demo:true}` |
| `GET /api/vehicles` | 200 | `{vehicles, demo:true}` from editable fixtures |
| `GET /api/signals` | 200 | `{signals, demo:true}` current mock states |
| `GET /api/incidents` | 200 | `{incidents, demo:true}` |
| `GET /api/alerts` | 200 | `{alerts, demo:true}` |
| `PATCH /api/alerts/:alertId` | 200 | `{alert, demo:true}` after `{ "acknowledged": true }` |
| `GET /api/operations/events` | 200 | `{events, demo:true}` mock operator actions |
| `GET /api/operations/summary` | 200 | `{summary, demo:true}` fleet and corridor counts |
| `GET /api/emergencies` | 200 | `{emergencies:[], demo:true}` |
| `POST /api/emergencies` | 201 | `{emergency, demo:true}` |
| `PATCH /api/signals/:signalId` | 200 | `{signal, demo:true}` |
| `POST /api/incidents` | 201 | `{incident, demo:true}` |
| `DELETE /api/incidents/:incidentId` | 200 | `{incident, demo:true}` |
| `GET /api/simulation/state` | 200 | `{simulation:{status, simulationTimeSeconds, incidentCount, demo:true}, demo:true}` |
| `POST /api/simulation/start` | 200 | `{simulation, demo:true}` |
| `POST /api/simulation/pause` | 200 | `{simulation, demo:true}` |
| `POST /api/simulation/reset` | 200 | `{status:"reset", emergencies:[], incidents:[], demo:true}` |

The Node simulation endpoints report mock service status only. The browser owns
the deterministic movement, scenarios, route calculation, and event timeline.
No server tick endpoint, database, or WebSocket is implemented. Phase 4 traffic
operations poll this API for in-memory signals, incidents, alerts, and events;
same-browser simulation movement is shared through a local browser snapshot.

Create an emergency with:

```json
{"ambulanceId":"AMB-07","baseNodeId":"BASE-1","destinationNodeId":"HOSP-1"}
```

`baseNodeId` must reference a base's node and `destinationNodeId` must reference
a hospital's node. The response adds `id`, `createdAt`, `status: "pending"`,
and `demo: true`; no route or ETA is generated. An ambulance ID already in use
returns 409 until reset.

Signal updates accept `state` (`red`, `yellow`, `green`) and/or `mode` (`normal`,
`manual`, `emergency`). At least one field is required:

```json
{"state":"green","mode":"manual"}
```

Create a mock road incident with all four fields:

```json
{"roadId":"R4","type":"accident","severity":"high","blocked":true}
```

Types: `accident`, `construction`, `rain`, legacy `heavy-rain`, `flood`,
`congestion`, and `blockage`. Severity: `low`, `medium`, `high`. `blocked` must
be a JSON boolean. The road's mock congestion rises to at least the incident
severity, and a blocking incident marks the road blocked. Removing an incident
recomputes from the fixture baseline plus remaining incidents, so a removed
closure can reopen a road when no other closure remains. Reset reloads the
fixtures and clears emergencies, incidents, alerts, operator events, and simulation status. Restarting
the Node process also clears in-memory changes.

Malformed JSON and invalid fields return 400, unknown entity IDs return 404, and
duplicate ambulance emergencies return 409. Unknown fields are rejected. Errors
use `{error:{code,message},demo:true}`. Request bodies are limited to 32 KB
(413 when exceeded), and requests that create or change records must use
`Content-Type: application/json`.
