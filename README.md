# VIALERT · Emergency mobility demo

VIALERT is a phased emergency mobility demo. Phase 6 adds explainable future
traffic risk to the Phase 5 incident-aware router, Phase 4 traffic operations
dashboard, Phase 3 simulation, Phase 2 ambulance dashboard, and Phase 1 mock
services and Bengaluru-inspired shared JSON graph.
All journeys, incidents, conditions, and signal states are **demo only**. There is
no real emergency dispatch, traffic control, GPS tracking, or measured prediction
accuracy.

## Local development

Prerequisites: Node.js **22.12+** with npm, Python **3.11+**, and
[uv](https://docs.astral.sh/uv/getting-started/installation/). `.nvmrc` selects Node
22 for nvm users. No API keys, database, or paid services are needed.

From the repository root:

```bash
npm ci
npm run setup:ai
npm run dev
```

`npm run dev` starts all three processes and stops the others if one exits. Use
Ctrl+C to stop them. Or run these in three separate terminals:

```bash
npm run dev:client
npm run dev:node
npm run dev:ai
```

| Service | Address | Purpose |
| --- | --- | --- |
| React + Vite | http://localhost:5173/traffic | Traffic operations, ambulance dashboard, and simulation control center |
| Node API | http://127.0.0.1:4000/api/health | In-memory city, emergency, signal, incident, and reset APIs |
| FastAPI | http://127.0.0.1:8000/health | Deterministic single and batch traffic forecasts |
| API explorer | http://127.0.0.1:8000/docs | Interactive FastAPI schema and requests |

Vite proxies `/api/*` to Node and `/ai/*` to FastAPI (removing `/ai`). Direct
browser routes are `/ambulance`, `/traffic`, and `/simulation`; refreshing any
route in local development returns the Vite app. Unknown routes redirect to
`/ambulance`. The dashboard checks Node health and reports unavailable services
honestly, then uses the checked-in city graph as a fallback. To change
ports/origins, see `client/.env.example` and `server-node/.env.example`; the AI
service accepts `CORS_ORIGINS` as an environment variable. Default settings work
without copying any env files. Stop an existing service if a default port is busy;
Vite deliberately refuses to choose a different port silently.

## Checks

```bash
npm run check        # TypeScript + frontend build, shared-data, Node, and Python tests
npm run test         # Includes routing, journey, voice-copy, and API-fallback tests
npm run smoke        # With npm run dev running: live health, proxy, data, and HTML checks
```

Individual checks: `npm run build`, `npm run test:data`, `npm run test:client`,
`npm run test:node`, and `npm run test:ai`. The smoke check is read-only. The Node tests use disposable
local servers and verify validation and reset without modifying fixture files.
The frontend production bundle is written to `client/dist/`; deployment is
outside the current phase.

## Phase 2 ambulance dashboard

Open [http://localhost:5173/ambulance](http://localhost:5173/ambulance). Choose
one of the shared demo hospitals, select **Start journey**, **Pause journey**, or
**Reset journey**, and watch the ambulance marker progress over the route. Each
demo tick advances simulated time deterministically; the displayed route, ETA,
next turn, and upcoming signal list follow that progress. Reset also asks the
Node API to clear its in-memory mock records when the service is available.

The map uses Leaflet with standard OpenStreetMap raster tiles and visible OSM
attribution. Internet access is needed for street tiles. If tiles fail, the page
switches to an SVG view of the shared city graph; the route, base, hospital,
signals, and high-congestion/blocked-road markers remain visible. A
`VITE_OSM_TILE_URL` environment value can point Leaflet at another compatible
tile service. Browser speech synthesis is optional: enable voice guidance and use
**Test voice**. Browser support and permissions vary, and this feature is not
connected to emergency systems.

The traffic-control and simulation pages are independently available at `/traffic`
and `/simulation`.

## Phase 3 simulation control center

Open [http://localhost:5173/simulation](http://localhost:5173/simulation). The
default demo is one ambulance from Central Ambulance Base to South Care Hospital.
Use **Start simulation**, **Pause**, **Resume**, or **Step 1 tick**; choose 1×,
2×, or 5× speed. The event timeline records scenario activations, junctions,
signals, reroutes, pauses, and arrival. **Restart current scenario** returns the
vehicle to its configured base while keeping current local scenario effects;
**Return to default route** clears them; **Reset simulation** also restores the
vehicle and speed defaults and clears the in-memory Node API state when available.

To replay a blockage demo, choose **Road blockage at Koramangala**, leave/select
`Central–Koramangala Link`, and activate it. The local A* route avoids the blocked
segment when an alternate route exists. For a no-route state, activate flood on
`South Hospital Access` and blockage on `Silk Board–South Hospital Link`; remove
or deactivate one of those scenarios to recover. Rain, construction, congestion,
and accident scenarios change local road cost and are shown on the map, environment
panel, route status, and event timeline. Reset restores the same initial state.

The map uses Leaflet/OpenStreetMap tiles without an API key and automatically
falls back to the same shared-graph SVG view if tiles are unavailable. Map and
Follow ambulance are implemented camera modes; Driver, Third-person, and Rear-view
are visibly labeled presentation placeholders. Optional voice alerts use browser
speech synthesis when available; the event timeline remains the written source of
truth. Simulation state and movement are local and deterministic. The Node API
records start/pause and mock incidents in memory; no WebSocket, real GPS, real
signal integration, or live emergency system is used.

Phase 3 Node endpoints are `GET /api/simulation/state`, `POST /api/simulation/start`,
`POST /api/simulation/pause`, `POST /api/simulation/reset`, `POST /api/incidents`,
and `DELETE /api/incidents/:incidentId`. See [API contracts](04-backend-realtime/API_SPEC.md).

## Phase 4 traffic operations center

Open [http://localhost:5173/traffic](http://localhost:5173/traffic). The fleet list
contains one demo ambulance and one demo bus from `shared-data/vehicles.json`.
Filter and select a vehicle to see its origin, location, destination, route,
speed, ETA, and upcoming signal. The map uses Leaflet/OpenStreetMap tiles, with a
manual graph toggle and automatic SVG graph fallback when tiles fail. Select
**Focus selected** or **Fit all vehicles**, and toggle route, signal, and incident
layers. Metrics and the event log describe simulated city state.

The signal console updates only mock in-memory state. Choose a signal, then
**Set green/yellow/red**; enabling **emergency priority** requires explicit
confirmation. Alerts can be filtered and acknowledged. When Node is offline,
the dashboard uses checked-in vehicle and city data; signal changes and derived
alert acknowledgements remain local to the browser.

Keep `/simulation` open in another tab of the same browser to see its ambulance
position, ETA, scenario alerts, and timeline events reflected in `/traffic`.
This uses a browser-local snapshot, polled by the traffic view. Node separately
shares mock signals, incidents, alerts, and operator events through polling.
The simulation feed is not cross-device or persistent. Closing the simulation
tab stops its timer; the traffic page retains its last snapshot for up to ten
minutes, then returns to the fixture route. None of these controls operate real
vehicles or lights.

For a judge demo: open both tabs; step or start the ambulance; activate a road
blockage in Simulation; return to Traffic to inspect its new location, route
warning, and incident marker. Change `S1` to yellow, enable priority through the
confirmation card, acknowledge the new alert, then clear the visible event log.

## Phase 5 incident-aware routing

The shared A* planner now applies explicit congestion, incident, rain, closure,
and simulated priority-signal costs. Open `/ambulance` to see the baseline
corridor. In `/simulation`, activate an accident on `R3 · Central–Koramangala
Link` or the Road blockage preset on the same road. The route recalculates from
the ambulance's current graph node, shows a reason and ETA change, and draws
the previous path as a muted dashed line. The timeline records the change.
Return to `/ambulance` and `/traffic` in the **same browser** to see the updated
driver route, operator alert/event, ETA, map, and incident state. The driver
page follows the Simulation journey while it is active; use Simulation controls
to move or reset it.

The Traffic incident desk can also create an accident, construction, heavy
rain, flood, congestion, or manual road block on a chosen graph road. Its
incidents are held in the Node mock API and polled into Simulation and
Ambulance; when Node is offline, operator-created incidents are stored only in
the same browser. A blocked road is excluded from A*. For a no-route demo,
close both `R10 · South Hospital Access` and `R12 · Silk Board–South Hospital
Link`; the UI names the closures and stays usable until one is cleared.

This is a hardcoded Bengaluru-inspired graph with heuristic costs, not real
traffic or live dispatch. There is no production GPS, authority system, AI
prediction input, database, or WebSocket service in Phase 5. See the
[routing notes](05-map-data-routing/ASTAR_ROUTING.md) and
[API contract](04-backend-realtime/API_SPEC.md).

## Phase 6 traffic prediction

Open [Traffic Operations](http://localhost:5173/traffic) and use **Prediction
desk**. Six roads from the shared graph are scored for a selectable demo time,
day, weather, holiday, nearby event, current congestion, local incidents, and
simulated priority signals. Select a corridor to inspect its 0–100 risk, next
30-minute window, contributing factors, confidence **label**, and recommended
operator/routing action. The map's **Future risk** layer uses dashed amber/red
road overlays. **Recalculate** requests FastAPI again; if it is offline, an
identical deterministic browser rule displays a labeled local fallback.

High and severe forecasts add a transparent 1.15× or 1.30× road-cost factor
to the Ambulance and Traffic A* views when **Apply forecast cost to demo
routes** is enabled. The driver view names the affected road and demo ETA
change. Simulation shows a scenario-linked forecast insight but preserves its
Phase 3 incident-only replay timing. The forecast settings are shared between
workspaces in the same browser. Node incidents or simulation scenarios update
the forecast inputs; neither a live feed nor a trained model is involved.

For a judge demo, keep the default weekday 18:00 setting and point to severe
Silk Board risk. Set **Heavy rain** to raise several road risks and see R3 add
roughly three minutes to the ambulance route; visit `/ambulance` to see that
explanation. In `/simulation`, activate an accident on R3 and inspect the
scenario-linked outlook and reroute timeline. Return to `/traffic`, select
Koramangala, and show the accident factor and operator pre-action. Clear the
scenario and weather assumption to return to baseline. These are deterministic
mock values, not measured travel-time or forecast accuracy.

## What Phase 1 includes

- Dark VIALERT navigation shell with three browsable workspace destinations.
- Shared data: nine nodes, twelve road links, six signals, one base, two fictional
  hospitals, six editable scenario presets, six Phase 6 forecast inputs, and two demo vehicles.
- Validated mock APIs with disposable in-memory state and a reset endpoint.
- Legacy Phase 1 rule-based predictions and separate Phase 6 factor-based
  forecasts. Confidence labels are heuristic, not calibrated accuracy. No
  model is trained.

The ambulance page reads health, city, and mock emergency data through
`client/src/services/apiClient.ts`; starting a trip posts a mock emergency and
reset clears mock API state when Node is available. Its A* route planner reads the
shared node, road, and adjacency fixtures and applies the documented congestion
weights. Phase 3 adds a single-vehicle, timed client-side simulation using those
same nodes, roads, routes, and mock incidents. Phase 4 adds an operator view and
simulated signal controls. Phase 5 adds dynamic mock incident-aware routing;
Phase 6 adds explainable, optional forecast costs and dashboard risk overlays.
Multi-vehicle movement, WebSockets, live GPS, real
dispatch, and live signal control remain future work. `socketClient.ts` remains a reserved placeholder.

## Code and contracts

```text
client/         React + Vite + TypeScript route-based frontend
server-node/    Node.js + Express mock API
server-ai/      Python + FastAPI mock predictions
shared-data/    Editable Bengaluru-inspired JSON fixtures
scripts/        Data integrity tests and live smoke checks
```

- [Node API contracts and examples](server-node/README.md)
- [FastAPI setup, prediction rules, and examples](server-ai/README.md)
- [Shared data format and editing rules](shared-data/README.md)
- [API inventory](04-backend-realtime/API_SPEC.md)
- [Build plan and next phases](06-project-management/BUILD_PLAN.md)

The following documentation describes the overall MVP vision, including features
that are **not implemented yet**.

## Overall MVP vision

VIALERT is a 24-hour hackathon MVP for emergency vehicle movement, traffic-signal awareness, and traffic prediction. The MVP focuses on one simulation demo with three main deliverables:

1. Ambulance Driver Dashboard
2. Government / Traffic In-charge Dashboard
3. AI Traffic Prediction Module

The system uses real-life maps for visualization, a hardcoded city graph for roads and signals, A* routing for emergency paths, and realtime-style updates through WebSocket or timed simulation. The simulation is the main demo layer because the team cannot test with real ambulances and real traffic lights during the hackathon.

## MVP Scope

The MVP should prove the idea visually and functionally. It does not need real government traffic data, real CCTV feeds, or real signal hardware. Those can be explained as future integrations.

## Tech Stack

| Layer | Choice |
| --- | --- |
| Frontend | React + Vite |
| Map visualization | Real-life maps using Leaflet / Mapbox / OpenStreetMap |
| Backend | Node.js + Python FastAPI |
| Routing algorithm | A* algorithm |
| Data | Hardcoded city graph, adjacency file, roads, signals, hospitals |
| Realtime feel | WebSocket or timed updates |
| AI prediction | Python model/API using simulated and historical-style features |

## Main User Roles

- Ambulance driver
- Traffic in-charge / government operator
- System admin or demo operator

## Documentation Structure

- `00-simulation-demo/`: simulation scenarios, engine, and demo flow
- `01-ambulance-dashboard/`: driver dashboard requirements and UI flow
- `02-traffic-incharge-dashboard/`: traffic control dashboard requirements
- `03-ai-traffic-prediction/`: model design, features, and API
- `04-backend-realtime/`: backend services and realtime communication
- `05-map-data-routing/`: city graph, maps, A* routing, data files
- `06-project-management/`: build plan, acceptance criteria, demo script
