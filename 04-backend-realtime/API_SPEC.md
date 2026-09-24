# Backend API Specification

## Implemented in Phase 1

All Node responses carry `demo: true`. The API keeps changes in memory and never
writes shared fixtures. See [Node contracts](../server-node/README.md) for exact
request/response shapes, enum values, and validation errors.

| Method | Path | Behavior |
| --- | --- | --- |
| GET | `/api/health` | Service health and phase |
| GET | `/api/city` | Nodes, roads, signals, hospitals, bases, adjacency, scenarios |
| GET | `/api/emergencies` | Pending demo emergencies, initially empty |
| POST | `/api/emergencies` | Record a pending emergency; no movement, route, or ETA |
| PATCH | `/api/signals/:signalId` | Update a mock signal's state and/or mode |
| POST | `/api/incidents` | Record a mock incident and update its road's mock disruption |
| POST | `/api/simulation/reset` | Reload fixtures and clear emergencies/incidents |

FastAPI provides `GET /health`, `POST /predict-traffic`, and `GET /predictions`.
See the [AI contract and rules](../server-ai/README.md). Predictions are stateless,
deterministic demo rules with heuristic confidence, not a trained model.

The tick endpoint described below is **planned for later phases and is not
implemented in Phase 1**. Neither service opens a WebSocket connection.

## MVP target contract

## Node.js API

### Get City Data

`GET /api/city`

Returns roads, nodes, signals, hospitals, and base locations.

### Start Emergency Trip

`POST /api/emergencies`

```json
{
  "ambulanceId": "AMB-07",
  "baseNodeId": "BASE-1",
  "destinationNodeId": "HOSP-1"
}
```

### Get Active Emergencies

`GET /api/emergencies`

Returns all active ambulances.

### Update Signal

`PATCH /api/signals/{signalId}`

```json
{
  "state": "green",
  "mode": "manual"
}
```

### Add Incident

`POST /api/incidents`

```json
{
  "roadId": "R4",
  "type": "accident",
  "severity": "high",
  "blocked": true
}
```

### Advance Simulation

`POST /api/simulation/tick`

Moves ambulance and updates dashboard state.

## Python FastAPI

### Predict Traffic

`POST /predict-traffic`

Predicts congestion for a selected area or road.
