# Data Model

## Node

```json
{
  "id": "N1",
  "name": "Central Junction",
  "type": "junction",
  "x": 120,
  "y": 240
}
```

## Road

```json
{
  "id": "R1",
  "from": "N1",
  "to": "N2",
  "distanceMeters": 600,
  "baseTravelSeconds": 80,
  "congestion": "medium",
  "blocked": false
}
```

## Signal

```json
{
  "id": "S1",
  "nodeId": "N2",
  "state": "red",
  "priorityActive": false
}
```

## Emergency

```json
{
  "id": "EMG-001",
  "ambulanceId": "AMB-07",
  "sourceNodeId": "N1",
  "destinationNodeId": "H1",
  "status": "active",
  "route": ["N1", "N2", "N5", "H1"],
  "currentNodeId": "N1",
  "etaSeconds": 420
}
```

## Incident

```json
{
  "id": "INC-001",
  "roadId": "R4",
  "type": "accident",
  "severity": "high",
  "blocked": true,
  "createdAt": "2026-09-24T00:00:00Z"
}
```

## Route Cost Formula

For the MVP:

```text
roadCost = baseTravelSeconds * congestionMultiplier
```

Suggested multipliers:

| Congestion | Multiplier |
| --- | --- |
| low | 1.0 |
| medium | 1.5 |
| high | 2.5 |
| blocked | unavailable |

