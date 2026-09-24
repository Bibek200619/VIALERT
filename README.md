# VIALERT · Phase 1 foundation

The runnable foundation contains a React + Vite shell, a Node.js mock API, a
FastAPI rule-based prediction service, and shared Bengaluru-inspired JSON data.
All data, signal changes, and predictions are **demo only**. There is no real
dispatch, traffic control, or measured prediction accuracy.

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
| React + Vite | http://localhost:5173 | Ambulance, traffic in-charge, and simulation placeholders |
| Node API | http://127.0.0.1:4000/api/health | In-memory city, emergency, signal, incident, and reset APIs |
| FastAPI | http://127.0.0.1:8000/health | Deterministic mock traffic predictions |
| API explorer | http://127.0.0.1:8000/docs | Interactive FastAPI schema and requests |

Vite proxies `/api/*` to Node and `/ai/*` to FastAPI (removing `/ai`). The frontend
checks actual service health and reports unavailable services honestly. To change
ports/origins, see `client/.env.example` and `server-node/.env.example`; the AI
service accepts `CORS_ORIGINS` as an environment variable. Default settings work
without copying any env files. Stop an existing service if a default port is busy;
Vite deliberately refuses to choose a different port silently.

## Checks

```bash
npm run check        # TypeScript + frontend build, shared-data, Node, and Python tests
npm run smoke        # With npm run dev running: live health, proxy, data, and HTML checks
```

Individual checks: `npm run build`, `npm run test:data`, `npm run test:node`, and
`npm run test:ai`. The smoke check is read-only. The Node tests use disposable
local servers and verify validation and reset without modifying fixture files.
The frontend production bundle is written to `client/dist/`; deploying services
and proxy configuration is outside Phase 1.

## What Phase 1 includes

- Three navigable placeholders with a dark theme and green emergency accent.
- Shared data: nine nodes, twelve road links, six signals, one base, two fictional
  hospitals, and five incident presets.
- Validated mock APIs with disposable in-memory state and a reset endpoint.
- Rule-based predictions with clear reasons and a fixed, uncalibrated demo
  confidence value. No model is trained.

The frontend currently reads health and city data. Mutation endpoints are available
for API development; final dashboard controls are deferred. Map rendering, A*,
ambulance movement, WebSockets, full simulation, and final dashboards belong to
later phases. `socketClient.ts` and reserved component folders are placeholders.

## Code and contracts

```text
client/         React + Vite + TypeScript shell
server-node/    Node.js + Express mock API
server-ai/      Python + FastAPI mock predictions
shared-data/    Editable Bengaluru-inspired JSON fixtures
scripts/        Data integrity tests and live smoke checks
```

- [Node API contracts and examples](server-node/README.md)
- [FastAPI setup, prediction rules, and examples](server-ai/README.md)
- [Shared data format and editing rules](shared-data/README.md)
- [Phase 1 API inventory](04-backend-realtime/API_SPEC.md)
- [Build plan and next phases](06-project-management/BUILD_PLAN.md)

For Phase 2, start with the ambulance placeholder, consume `/api/city` using
`client/src/services/apiClient.ts`, and add map rendering against the shared node
IDs. The following documentation describes the overall MVP vision, including
features that are **not implemented yet**.

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
