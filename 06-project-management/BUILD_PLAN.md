# Build Plan

## Phase 1: Project Setup

- Create React + Vite frontend.
- Create Node.js backend.
- Create Python FastAPI prediction service.
- Add basic hardcoded city graph files.

## Phase 2: Ambulance Dashboard

- Add separate `/ambulance`, `/traffic`, and `/simulation` routes with refresh support.
- Implement the ambulance driver dashboard using shared Bengaluru graph data.
- Calculate a weighted A* route and show base, hospital, ambulance, roads, and signals.
- Add deterministic browser timer controls for start, pause, and reset.
- Update route progress, ETA, next turn, and signal awareness during movement.
- Add optional browser speech guidance and a graph-map fallback for unavailable tiles.
- Keep traffic-control and city-wide simulation workspaces as labeled placeholders.

## Phase 3: Simulation Engine

- Complete: add a deterministic single-ambulance simulation workspace at `/simulation`.
- Complete: add start, pause, resume, step, reset, 1×/2×/5×, vehicle, scenario, and camera-mode controls.
- Complete: support accident, construction, rain, flood, congestion, and road-blockage overlays, event timeline, optional browser voice alerts, and route recalculation/no-route states.
- Complete: add in-memory Node simulation-status and incident create/delete endpoints with fixture-safe reset behavior.
- Deferred: synchronized multi-view state, multiple vehicles, real traffic/signal sources, persistence, and WebSockets.

## Phase 4: Traffic In-charge Dashboard

- Show all ambulances.
- Show alerts.
- Show traffic signals.
- Add manual signal controls.
- Add event log.

## Phase 5: Routing

- Extend the Phase 3 A* demo with production-quality network data, live incident feeds, and predicted-traffic rerouting.
- Validate route costs and travel-time estimates against real or curated data.

## Phase 6: AI Prediction

- Create sample prediction dataset.
- Build rule-based or simple ML model.
- Expose FastAPI endpoint.
- Show predicted traffic areas on dashboards.

## Phase 7: Demo Polish

- Add curated one-click judge scenarios and capture screenshots/recording.
- Prepare final pitch and presentation flow.
