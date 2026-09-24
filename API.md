# API Specification

This API is for the MVP backend. Names can be adjusted based on the final framework.

## Health

`GET /api/health`

Returns service status.

```json
{
  "status": "ok"
}
```

## Get Road Network

`GET /api/network`

Returns nodes, roads, signals, hospitals, and ambulance locations.

## Create Emergency

`POST /api/emergencies`

```json
{
  "ambulanceId": "AMB-07",
  "sourceNodeId": "N1",
  "destinationNodeId": "H1",
  "priority": "critical"
}
```

Response:

```json
{
  "emergencyId": "EMG-001",
  "status": "active",
  "route": ["N1", "N2", "N5", "H1"],
  "etaSeconds": 420
}
```

## Get Active Emergency

`GET /api/emergencies/active`

Returns active emergency, current route, location, ETA, and signal status.

## Update Incident

`POST /api/incidents`

```json
{
  "roadId": "R4",
  "type": "accident",
  "severity": "high",
  "blocked": true
}
```

## Update Congestion

`PATCH /api/roads/{roadId}/traffic`

```json
{
  "congestion": "high"
}
```

## Advance Simulation

`POST /api/simulation/tick`

Moves the ambulance forward and updates signal priority.

## Reset Demo

`POST /api/simulation/reset`

Resets roads, incidents, signals, and ambulance state.

