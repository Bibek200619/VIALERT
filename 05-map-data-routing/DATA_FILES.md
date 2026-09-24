# Data Files

The Phase 1 fixtures live in [`shared-data/`](../shared-data/README.md). They use
Bengaluru-inspired coordinates and fictional facilities and road links. The
examples below illustrate individual records; actual collection files are JSON
arrays, except `adjacency.json`, which is an object keyed by node ID.

`scenarios.json` provides six inactive presets: `accident`, `construction`,
`rain` (displayed as heavy rain), `flood`, `congestion`, and `blockage`. Each
includes a unique ID, road reference, severity, active flag, duration, name,
description, and a `blocked` hint for closures. The Phase 3 browser simulation
interprets these local overlays; they never mutate fixture files. The Node mock
incident API accepts `rain` and the legacy `heavy-rain` spelling.

`vehicles.json` adds one mock ambulance and one mock bus for Phase 4. Their
origin/current/destination node references are validated by `npm run test:data`.
The frontend calculates route preview and ETA with the existing A* graph; the
fixture records do not contain live locations.

## `nodes.json`

Stores map points or graph junctions.

```json
{
  "id": "N1",
  "name": "Main Junction",
  "lat": 26.1445,
  "lng": 91.7362,
  "type": "junction"
}
```

## `roads.json`

Stores roads between nodes.

```json
{
  "id": "R1",
  "from": "N1",
  "to": "N2",
  "distanceMeters": 800,
  "baseTimeSeconds": 90,
  "congestion": "medium",
  "blocked": false
}
```

## `signals.json`

Stores traffic-light data.

```json
{
  "id": "S1",
  "nodeId": "N2",
  "state": "red",
  "mode": "normal"
}
```

## `hospitals.json`

Stores destination points.

```json
{
  "id": "HOSP-1",
  "name": "City Hospital",
  "nodeId": "N8"
}
```

## `bases.json`

Stores ambulance base points.

```json
{
  "id": "BASE-1",
  "name": "Ambulance Base 1",
  "nodeId": "N1"
}
```

## `adjacency.json`

Stores graph connections for A*.

```json
{
  "N1": [
    { "to": "N2", "roadId": "R1" },
    { "to": "N3", "roadId": "R2" }
  ]
}
```
