# Simulation Scenarios · Phase 3

The simulation uses fictional incidents over `shared-data/roads.json` and the
shared adjacency graph. Presets in `shared-data/scenarios.json` start inactive.
Choose a preset, road or junction, and severity in the Scenario ledger, then
activate it while playback is stopped. Effects are local and clearly simulated.

| Type | Demo effect |
| --- | --- |
| Accident | Adds an incident marker/alert and raises congestion and travel cost; an operator may also mark the road closed. |
| Construction | Marks the segment as slow, increasing congestion and route cost; an operator may also mark the road closed. |
| Heavy rain (`rain`) | Adds an environmental warning and raises cost/congestion on the selected link and connected links. |
| Flood | Closes the selected road so A* must avoid it or report no route. |
| Congestion | Raises the selected segment's travel cost and refreshes ETA. |
| Road blockage (`blockage`) | Closes the selected road and triggers rerouting or a no-route state. |

## Judge replay

1. Open `/simulation`, press **Reset simulation**, and confirm the default route.
2. Select **Road blockage at Koramangala** on **Central–Koramangala Link** and
   activate it. The current route is recalculated around that road.
3. Remove the blockage, activate **Heavy rain at Silk Board**, then press
   **Step 1 tick** to observe the written event and local cost effect.
4. To demonstrate no route, select **South Hospital Access** and activate a
   flood, then block **Silk Board–South Hospital Link**. Remove or deactivate
   either closure to restore an available route.
5. Reset and replay: the same initial vehicle, route, clock, and inactive
   scenario set are restored.

The timer advances one, two, or five graph segments per second at 1×, 2×, and
5×. A simulated segment advances the displayed clock by 30 seconds; this is a
replay convention, not a road-speed estimate. Scenario durations use the same
simulated clock. The event timeline records scenario changes, route updates,
junctions, signals, pauses, and arrival.

In Phase 5, operator-created incidents from `/traffic` are also applied to this
route through the mock Node feed or same-browser offline storage. A* recalculates
from the current graph node, and the route monitor describes the affected road,
ETA difference, or all blocking roads in a no-route state. The prior route is
dashed on the map after a change. Reset clears the local and Node demo incidents.

The map, route, affected roads, vehicle, and event list visualize these demo
effects. No real signal is changed, no traffic sensor is consulted, and no
real government traffic feed is connected. Optional
browser voice alerts supplement (and never replace) written event messages.
