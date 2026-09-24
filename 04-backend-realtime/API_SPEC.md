# Backend API Specification

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

