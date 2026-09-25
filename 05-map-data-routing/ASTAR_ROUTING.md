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

## Phase 5–6 demo cost formula

```text
effectiveSeconds = baseTimeSeconds × congestionMultiplier
                 × incidentPenalty × weatherMultiplier × forecastMultiplier
                 × prioritySignalBenefit
```

`client/src/features/routing/dynamicRouting.ts` owns these explainable factors.
Accident, construction, and heavy congestion raise the incident factor; rain
raises the weather factor on the selected link and nearby connectors. A mock
emergency-priority signal at the next node gives a modest 0.9 factor. A blocked
road has infinite cost and is excluded by A*. Multiple active overlays combine
deterministically. Phase 6 optionally adds a 1.15 forecast multiplier for high
and 1.30 for severe predicted risk on a named graph road. Low/medium risk adds
none. The operator can switch forecast costs off without hiding the predictions.
Forecasts come from explainable FastAPI rules or an identical browser fallback;
they are not trained AI or calibrated travel times. Simulation's deterministic
replay retains its Phase 3 incident-only timing; Ambulance and Traffic show the
forecast-adjusted A* ETA and a written explanation when a route road is affected.

Suggested multipliers:

| Congestion | Multiplier |
| --- | --- |
| low | 1.0 |
| medium | 1.5 |
| high | 2.5 |
| blocked | unavailable |

## Heuristic

Use a conservative straight-line time lower bound between graph nodes. The
heuristic remains below every traversable edge's possible time, including the
mock priority benefit, so A* can compare alternate paths safely.

## Rerouting

Trigger rerouting when:

- a road becomes blocked,
- congestion becomes high,
- a simulated rain, accident, construction, or congestion overlay changes cost,
- traffic in-charge manually closes a route.

Simulation recalculates from its current graph node on scenario/operator-incident
changes and logs the cause plus ETA difference. Ambulance and Traffic derive the
same route from the shared fixture graph and current mock conditions. A previous
route appears as a dashed line after a path change. If no path remains, the
explanation names blocked roads and tells the operator to clear an incident or
reset. Phase 6 adds a mock prediction factor without real traffic authority
data or trained model inference.
