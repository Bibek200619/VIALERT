# Node demo API — Phase 1

This is a local, in-memory mock API. It does not dispatch ambulances, control real
signals, calculate routes, or run simulation ticks. All responses include
`demo: true`. Emergencies remain `pending` until reset.

From the repository root, install workspace dependencies with `npm install`, then
run `npm run dev --workspace @vialert/server-node`. Node.js 22.12+ is required.
The API starts at `http://127.0.0.1:4000`. `npm start --workspace
@vialert/server-node` starts without the file watcher. Run checks with `npm test
--workspace @vialert/server-node`.

Optional settings: copy `server-node/.env.example` to `server-node/.env` and edit
`HOST`, `PORT`, or `CLIENT_ORIGIN`. The default CORS origin is
`http://localhost:5173` and the default host binds locally.

## Contracts

| Endpoint | Status | Response |
| --- | --- | --- |
| `GET /api/health` | 200 | `{status:"ok", service:"vialert-node", phase:1, demo:true}` |
| `GET /api/city` | 200 | `{nodes, roads, signals, hospitals, bases, adjacency, scenarios, demo:true}` |
| `GET /api/emergencies` | 200 | `{emergencies:[], demo:true}` |
| `POST /api/emergencies` | 201 | `{emergency, demo:true}` |
| `PATCH /api/signals/:signalId` | 200 | `{signal, demo:true}` |
| `POST /api/incidents` | 201 | `{incident, demo:true}` |
| `POST /api/simulation/reset` | 200 | `{status:"reset", emergencies:[], incidents:[], demo:true}` |

Create an emergency with:

```json
{"ambulanceId":"AMB-07","baseNodeId":"BASE-1","destinationNodeId":"HOSP-1"}
```

`baseNodeId` must reference a base's node and `destinationNodeId` must reference a
hospital's node. The response adds `id`, `createdAt`, `status: "pending"`, and
`demo: true`; no route or ETA is generated. An ambulance ID already in use returns
409 until reset.

Signal updates accept `state` (`red`, `yellow`, `green`) and/or `mode` (`normal`,
`manual`, `emergency`). At least one field is required:

```json
{"state":"green","mode":"manual"}
```

Create an incident with all four fields:

```json
{"roadId":"R4","type":"accident","severity":"high","blocked":true}
```

Types: `accident`, `construction`, `heavy-rain`, `flood`, `congestion`. Severity:
`low`, `medium`, `high`. `blocked` must be a JSON boolean. The road's mock
congestion rises to at least the incident severity; a blocking incident marks the
road blocked. Later incidents cannot lower congestion or reopen a road. The
reset endpoint restores roads and signals from the shared JSON files and clears
all emergencies and incidents. Restarting the server also clears changes. The
fixture files are never modified.

Malformed JSON and invalid fields return 400, unknown entity IDs return 404, and
duplicate ambulance emergencies return 409. Unknown fields are rejected. All
errors use `{error:{code,message},demo:true}`. Request bodies are limited to 32 KB
(413 for larger bodies). Requests that create or change records must use
`Content-Type: application/json`.
