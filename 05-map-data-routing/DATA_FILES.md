# Data Files

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

