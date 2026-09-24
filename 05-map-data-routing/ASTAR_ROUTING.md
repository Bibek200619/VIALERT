# A* Routing

## Purpose

A* finds the best route from ambulance base to destination while considering distance and traffic conditions.

## Input

- Start node
- Destination node
- Road graph
- Road congestion
- Blocked roads
- Predicted traffic zones

## Output

- Ordered list of nodes
- Ordered list of roads
- Estimated travel time
- Signals on the route

## Cost Formula

```text
cost = baseTimeSeconds * congestionMultiplier + predictionPenalty
```

Suggested multipliers:

| Congestion | Multiplier |
| --- | --- |
| low | 1.0 |
| medium | 1.5 |
| high | 2.5 |
| blocked | unavailable |

## Heuristic

Use straight-line distance between current node and destination node based on latitude and longitude.

## Rerouting

Trigger rerouting when:

- a road becomes blocked,
- congestion becomes high,
- AI predicts heavy congestion ahead,
- traffic in-charge manually closes a route.

