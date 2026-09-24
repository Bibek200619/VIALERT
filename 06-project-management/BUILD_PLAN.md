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

- Expand the single browser demo into a scenario-driven simulation service.
- Add accident and congestion events and time-based scenario controls.
- Define synchronized journey state for future workspaces.
- Keep automatic or operator signal changes explicitly mock-only.
- Plan update delivery for multiple views; WebSockets remain deferred until needed.

## Phase 4: Traffic In-charge Dashboard

- Show all ambulances.
- Show alerts.
- Show traffic signals.
- Add manual signal controls.
- Add event log.

## Phase 5: Routing

- Extend the Phase 2 A* demo with dynamic incident costs and route recalculation.
- Add road blockage and predicted-traffic rerouting scenarios.

## Phase 6: AI Prediction

- Create sample prediction dataset.
- Build rule-based or simple ML model.
- Expose FastAPI endpoint.
- Show predicted traffic areas on dashboards.

## Phase 7: Demo Polish

- Add reset button.
- Add one-click demo scenario.
- Add screenshots.
- Prepare final pitch.
