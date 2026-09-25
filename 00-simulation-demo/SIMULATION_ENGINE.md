# Simulation Engine · Phase 3

The `/simulation` workspace is a deterministic, single-ambulance browser demo
over the shared Bengaluru-inspired graph. It demonstrates route progress,
scenario effects, route-cost changes, and event history. It is not a physical
traffic model, a dispatch system, or a source of live traffic information.

## State and update loop

`client/src/features/simulation/simulationEngine.ts` contains a pure reducer.
The UI owns a single one-second interval in `useSimulation.ts`; while running,
it dispatches one `tick` action. A 1×, 2×, or 5× multiplier advances that many
graph edges per timer tick. **Step 1 tick** advances exactly one edge and pauses
again. Each traversed graph edge advances the demo clock by 30 seconds. These
fixed steps make playback easy to reproduce; they do not model real speed or
elapsed driving time.

The state records status, simulation time, speed, selected vehicle, active
scenario IDs, current graph node, route node/road IDs, distance travelled and
remaining, ETA, route status/message, scenario records, and ordered timeline
events. Reset builds the same initial state from the current city fixture and
default vehicle settings. Event IDs and timestamps are deterministic within a
replay; wall-clock dates are not used by the client simulation engine.

## Route and scenario effects

The engine reuses the Phase 2 A* planner. Scenario overlays are applied to a
copy of the in-memory city graph and never alter the checked-in JSON. Phase 5
centralizes congestion, incident, weather, closure, and mock priority-signal
costs in `features/routing/dynamicRouting.ts`.
Accident, construction, and congestion increase costs on the selected road;
rain increases cost and congestion on adjacent demo links. Flood and blockage
mark the selected road unavailable. When an activation, removal, expiry, or
vehicle configuration changes route inputs, the engine recalculates from the
ambulance's current node and updates ETA, distance, route status, and a written
reason with the named cause and ETA difference. The previous route remains a
muted dashed line after a path change. Operator mock incidents are polled from
Node (or same-browser local storage when offline) and enter the same reducer as
external scenarios; simulation-owned incidents are not applied twice. If no
path remains, playback pauses in an explicit unavailable state;
removing a blocking condition allows recovery.

Each scenario can be placed on a graph road or junction, assigned a severity,
and activated, deactivated, or removed while the simulation is stopped. A
scenario duration is measured in simulated seconds. Expiration deactivates the
condition and recalculates the route. Scenarios are local mock overlays; the
Node API receives corresponding mock incidents when available, but does not
own the browser's route or tick loop.

## Map and camera modes

Leaflet displays the fictional graph over OpenStreetMap tiles, with attribution.
No paid key is used. If tiles fail or the map library cannot initialize, the
workspace falls back to an SVG graph map using the same roads, route, base,
hospital, signal, ambulance, and incident data. Map view and Follow ambulance
are implemented. Driver, Third-person, and Rear-view mirror are labeled
placeholders; there is no 3D city scene.

## Node API boundary

The Node service maintains disposable in-memory status and incident records:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/simulation/state` | Read mock status and incident count |
| `POST` | `/api/simulation/start` | Mark mock service status running |
| `POST` | `/api/simulation/pause` | Mark mock service status paused |
| `POST` | `/api/simulation/reset` | Clear in-memory incidents/emergencies and restore fixtures |
| `POST` | `/api/incidents` | Add a mock road incident |
| `DELETE` | `/api/incidents/:incidentId` | Remove a mock incident and recompute affected road overlays |

The client continues with shared local data when the API is unavailable. The
server does not implement a simulation tick endpoint, persistence, a database,
or WebSockets. Existing Phase 1 endpoints retain their response contracts.

## Later work

Multiple vehicles, government/operator controls, real signal integration, live
GPS, production-grade traffic data, trained AI, WebSockets, and a 3D city view
are outside Phase 3.
