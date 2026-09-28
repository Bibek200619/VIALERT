# VIALERT project audit

Audit and rebuild completed on 28 September 2026. The user asked for a full runtime and architecture review, a replacement UI, and a more convincing simulation. Existing visual requirements in design documents were not used as a constraint.

## Project at a glance

VIALERT is a browser based emergency mobility demonstration. The React application provides four workspaces: Overview (`/demo`), Driver (`/ambulance`), Traffic operations (`/traffic`), and Simulation (`/simulation`). The city network and its vehicles are fictional fixtures in `shared-data/`.

The browser owns ambulance movement, the A* route calculation, scenario effects, and most presentation state. It sends operation requests to an Express API and forecasts to a FastAPI service. Express keeps mock incidents, signal changes, alerts, and operator events in process memory. FastAPI calculates forecasts from explicit rules. Both services can be unavailable while the browser continues with the checked in city data and local forecast rules. The socket client is a placeholder; pages use polling and same profile browser storage.

| Area | Working behavior | Boundary before this audit |
| --- | --- | --- |
| Driver route | A* selects a connected route, prices traffic costs, updates trip distance and ETA, and reports turns and signals. | Small fictional graph; no GPS or dispatch feed. |
| Traffic operations | Displays fixture vehicles and alerts; operators can create and clear mock incidents, acknowledge alerts, and change mock signal states. | Express state is in memory and is not shared across processes or devices. |
| Simulation | Runs and steps a deterministic local journey, changes route under scenarios, and publishes a snapshot for other pages in the same browser. | The old tick advanced too coarsely for continuous driving; no server simulation clock. |
| Forecast | Returns explainable congestion factors, recommendations, and a local fallback. | Deterministic rules; confidence and risk are labels and scores, not calibrated prediction probabilities. |
| Map and scene | Leaflet uses OpenStreetMap tiles where available and an SVG graph fallback otherwise. The simulation scene is generated from demo coordinates. | City geometry and structures are illustrative; they are not a surveyed Bengaluru map or real vehicle camera feed. |

## Audit findings and repairs

### Routing and shared data

- **A* could overestimate route cost under unusual road weights.** Its lower bound now derives the cheapest observed seconds-per-meter ratio from the current graph and cost layer.
- **Malformed geometry and zero-length route edge cases were weakly guarded.** City API payloads now validate graph references, unique IDs, road metrics, facilities, scenarios, signals, and adjacency. Journey advancement validates elapsed time, handles zero ETA, and avoids dividing by a zero-length edge.
- **Turn guidance could select an invalid final segment.** Arrival is determined from route node count, and displayed time is clamped to a finite nonnegative value.
- **The client could accept a structurally incomplete city response.** The API client now validates the graph before adopting service data and retains the checked-in graph when a response is invalid.
- **Simulation movement and the map could disagree.** Both views now use the same distance-weighted road polyline and interpolate the vehicle position along it.

### Simulation and maps

- **The old presentation advanced in large jumps.** The engine now integrates elapsed time in bounded steps, accelerates and brakes, caps cruise speed, waits at non-green signals, reduces route distance continuously, and expires scenarios against simulation time.
- **The old viewport did not provide a coherent city scene or usable camera framing.** The simulation now builds a Three.js street scene with connected road surfaces, lane markings, buildings, signals, traffic fixtures, an ambulance model, a highlighted route, and Orbit, Driver, Rear, Map, and Follow modes. Orbit follows the vehicle heading; Driver and Rear omit the route ribbon from the camera view.
- **The scene needed more visual context and clearer live feedback.** Seeded asphalt grain, signal housings and lamps, roadside trees, and moving fixture vehicles now add detail. Roads sit flush with the ground plane, and route telemetry shares one wide rail at the foot of the viewport instead of several floating widgets. A browser run showed the ambulance accelerating to 30 km/h and advancing along the route.
- **The scene used too much geometry for lane marks.** Lane markings are batched into an instanced mesh. The three-dimensional scene is lazy loaded and appears only on the Simulation page.
- **Disabled or blocked browser storage could throw before fallback code ran.** Incident and simulation snapshot reads now use guarded browser-storage helpers. A local write reports failure instead of claiming the incident was saved.
- **OSM tiles can be unavailable without network access.** Leaflet switches to the local graph fallback after tile failure or timeout.

### Backend and forecasts

- **Emergency creation could accept unknown vehicle IDs or non-ambulance vehicles.** The Node service now requires a known fixture ambulance, valid base node, and valid hospital node.
- **Repeated signal changes and acknowledgements wrote duplicate operations events.** Idempotent updates now preserve state without adding duplicate events; emergency-priority alerts are tied to their signal and marked resolved when that mode ends.
- **Node state-changing requests did not have a mutation-origin check, and JSON size was unbounded.** The API now restricts mutation origins to the configured list, limits JSON bodies to 32 KB, removes the Express fingerprint header, and returns stable errors for malformed paths and unsupported encodings. This remains a local demo API, not an authenticated production service.
- **Forecast input could pair an area with an unrelated road and accept an oversized incident list.** FastAPI now checks that the selected area is an endpoint of the road and limits incident input size.
- **School travel weighting could affect weekends; heavy-rain inputs could be underweighted when rain intensity disagreed.** School peak applies only to non-holiday weekdays, and `heavy-rain` consistently receives the heavy-rain score.

### UI

The old interface has been replaced with one shared navigation system, a spacious page layout, larger work areas, clearer route hierarchy, and responsive behavior. The Simulation page centers the viewport and groups vehicle setup, conditions, forecast, and event history into one tabbed mission inspector. The Overview hero introduces the demo flow, and the Driver and Traffic workspaces use the same navigation, map treatment, spacing, and status language. Traffic operations now presents Inbox, Incidents, Signals, Forecast, and Activity as selectable tabs so one workspace panel is visible at a time. The stale dark demo stylesheet was removed, and the Overview runbook contrast and capability labels were strengthened after visual review.

## Remaining system limits

- City roads, travel times, signals, vehicle locations, and incidents are mock data. Added waypoints and buildings improve the scene but do not make it geographic or operationally accurate.
- Forecasts are deterministic rules in Python and TypeScript; they do not learn from traffic history or ingest live traffic. A confidence label is not a probability.
- The Node store is volatile and has no user authentication. Signal and incident controls simulate effects only; they do not connect to physical hardware.
- Browser snapshots synchronize only within the same browser profile. There is no database, WebSocket service, multi-user coordination, real dispatch, GPS, or server-owned simulation clock.
- The Three.js output is lazy loaded but still produces a 573.66 KB minified chunk (145.42 KB gzip) and triggers Vite's 500 KB chunk warning. The Overview and map-only workspaces do not load that scene chunk.

## Verification during this rebuild

- `npm run build` completed successfully after the final scene and UI changes. TypeScript compilation and the Vite production bundle both completed; Vite reported the known Three.js chunk-size warning above.
- `npm audit --audit-level=high` completed for the root, frontend, and Node API packages. Each reported zero vulnerabilities.
- `git diff --check` completed without whitespace errors.
- Browser review covered the Simulation scene in Orbit and Driver modes, a moving ambulance, the Overview page, and the Traffic operations desk. The desktop layout was reviewed at 1440 px; simulation mobile layout was reviewed at 390 px with no horizontal overflow. The moving run reached 30 km/h and reported route progress. The local browser showed the expected Node and FastAPI offline fallbacks; no API process was running during this review.
- The automated test suite was not rerun after the rebuild. Earlier repository checks passed before this UI and simulation pass; that earlier result does not prove the current tree's automated tests pass.
- The Three.js world is generated locally from route waypoints. No downloaded NAVIGEN assets were copied into this project. NAVIGEN's world geometry, lighting, and camera behavior served as the simulation reference: <https://github.com/Bibek200619/NAVIGEN/tree/main/web_app/simulation>.
