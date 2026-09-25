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

- Complete: show the shared demo ambulance and bus, filters, selection, origin,
  current location, destination, ETA, and route preview.
- Complete: city operations map with fleet markers, mock signals/incidents,
  layer/focus controls, and SVG graph fallback.
- Complete: in-memory signal state and emergency priority changes with browser
  confirmation, operator alerts, acknowledgement, event log, and metrics.
- Complete: same-browser Phase 3 movement snapshot and Node-offline local data.
- Deferred: cross-device real-time synchronization, real hardware, multiple
  moving vehicles, production roles/authentication, and calibrated AI warnings.

## Phase 5: Routing

- Complete: extend the shared A* demo with explicit incident, weather, congestion, closure, and mock signal-priority costs.
- Complete: recalculate from the current graph node as local scenarios or operator-created mock incidents change; explain changed routes, ETA, and no-route states in all three workspaces.
- Complete: keep the Bengaluru-inspired fixture graph, in-memory Node incidents, and same-browser simulation bridge. Real road feeds, calibrated travel times, and AI prediction remain later work.

## Phase 6: AI Prediction

- Complete: six graph-linked forecast examples and strict single/batch FastAPI inputs and outputs.
- Complete: deterministic, explainable scoring from time, current congestion, weather, incidents, holidays/events, school peak, and simulated signal priority.
- Complete: operator prediction desk, recommendations, risk overlay, cross-workspace outlook, and an optional high/severe A* forecast cost on Ambulance and Traffic.
- Complete: labeled browser-local fallback when FastAPI is offline; legacy Phase 1 prediction routes retained.
- Deferred: trained/calibrated model, real traffic history or feed, backend-wide forecast state, and prediction-aware Simulation movement.

## Phase 7: Demo Polish

- Add curated one-click judge scenarios and capture screenshots/recording.
- Prepare final pitch and presentation flow.
