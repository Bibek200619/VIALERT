# VIALERT Simulation Control Center · Phase 3

The simulation at `/simulation` is a deterministic, single-ambulance demo over
the shared Bengaluru-inspired graph. It demonstrates local incident effects,
route-cost changes, rerouting, signal encounters, and event history. It is not a
city traffic simulator and does not contact real emergency or signal systems.

## Run and replay

From the repository root, run `npm run dev` and open
`http://localhost:5173/simulation`. The Node API is optional: the browser uses the
same checked-in graph when Node is offline. Street tiles use Leaflet and
OpenStreetMap without a paid key; if tiles fail, the page switches to the shared
SVG graph map.

The starting configuration is `AMB-07` from Central Ambulance Base to South Care
Hospital. The driver panel allows the ID, vehicle number, starting base,
destination, priority, and A*-calculated route to be changed while the simulation
is stopped.

- **Start / Pause / Resume** controls timed playback.
- **Step 1 tick** advances one graph segment from a stopped state.
- **1× / 2× / 5×** advances up to one, two, or five graph segments per one-second
  local timer tick. The displayed simulation clock and event log advance
  deterministically; speed does not represent real road speed.
- **Restart current scenario** returns to the configured base and preserves
  active conditions.
- **Return to default route** restores the default unit and destination and
  clears active scenarios. It retains the selected playback speed; **Reset
  simulation** restores 1× speed.
- **Reset simulation** returns to the same initial local state and asks the Node
  API to clear in-memory incidents and status when available.

To replay a reroute, choose **Road blockage at Koramangala** on
`Central–Koramangala Link` and activate it. The A* engine recalculates from the
ambulance's current graph node. For a no-route state, block both
`South Hospital Access` and `Silk Board–South Hospital Link`; the route panel
explains that a blocking scenario must be removed. Deactivate or remove either
condition to recalculate an available route.

## Scenario types

The scenario panel supports accident, construction, heavy rain, flood,
congestion, and road blockage. A scenario preset, road or junction, and severity
are selectable. Scenario effects are visible in the map markers/road styling,
route status and ETA, environment panel, written event timeline, and optional
browser voice alerts. Activating or removing a scenario recalculates the active
route. Flood and road blockage make selected roads unavailable; the other types
raise congestion and route cost without changing shared JSON fixtures.

Map view and Follow ambulance are implemented. Driver, Third-person, and
Rear-view mirror are labeled placeholders; there is no 3D city model. Voice
alerts use browser speech synthesis when available and never imply a connection to
real dispatch.

## Files and testing

Simulation-specific logic lives in `client/src/features/simulation/`, including a
pure reducer/route-effect engine and deterministic tests. `server-node` provides
in-memory start, pause, state, reset, incident-create, and incident-delete
endpoints. It does not own the browser's tick loop, and no database or WebSocket
is used.

Run `npm run check` and `npm run test` for build and unit/API checks. With
`npm run dev` active, run `npm run smoke` for the frontend/API health and proxy
check.
