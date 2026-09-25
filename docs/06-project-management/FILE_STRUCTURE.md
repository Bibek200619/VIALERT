# VIALERT file structure

This is the current repository layout. All paths below are relative to the project root. Start with the [root README](../../README.md) for setup and the architecture diagram.

```text
VIALERT/
├── frontend/                         All browser code
│   ├── public/                       Static assets
│   ├── src/
│   │   ├── app/                      Route table and app shell
│   │   ├── pages/                    Four browser workspaces
│   │   ├── features/
│   │   │   ├── ambulance/            Driver UI, journey hook, A* planner
│   │   │   ├── traffic/              Operator dashboard, state, and panels
│   │   │   ├── simulation/           Scenario engine, controls, and camera views
│   │   │   ├── routing/              Incidents and road-cost adjustments
│   │   │   ├── prediction/           Forecast requests and local fallback
│   │   │   └── demo/                 Guided reset
│   │   ├── components/               Reusable UI and map pieces
│   │   ├── services/                 API client and socket placeholder
│   │   └── styles/                   Shared CSS
│   ├── .env.example                  Optional frontend configuration
│   ├── package.json                  Frontend dependencies and commands
│   └── vite.config.ts                Dev server and API proxies
├── backend/
│   ├── server-node/                  Express operations API
│   │   ├── src/routes/api.js         Endpoint definitions
│   │   ├── src/services/             Business rules and validation
│   │   ├── src/data/store.js         Disposable in-memory state
│   │   ├── src/app.js                Express app
│   │   ├── src/index.js              HTTP entry point
│   │   ├── test/                     API checks
│   │   └── .env.example              Optional host, port, CORS origin
│   └── server-ai/                    FastAPI prediction API
│       ├── app/main.py               Endpoint definitions
│       ├── app/model.py              Deterministic scoring
│       ├── app/schemas.py            Validation and response models
│       ├── app/sample_data/          Legacy prediction inputs
│       ├── tests/                    API and forecast checks
│       └── pyproject.toml            Python dependencies
├── docs/                              Project documentation
│   ├── PROJECT_OVERVIEW.md            Original MVP vision
│   ├── 00-simulation-demo/            Scenarios and simulation behavior
│   ├── 01-ambulance-dashboard/        Driver requirements
│   ├── 02-traffic-incharge-dashboard/ Operator requirements
│   ├── 03-ai-traffic-prediction/      Forecast requirements
│   ├── 04-backend-realtime/           API contract and realtime proposal
│   ├── 05-map-data-routing/          Fixture and A* notes
│   └── 06-project-management/        Plans, demo script, and this map
├── shared-data/                       City graph and forecast JSON fixtures
├── scripts/                           Repository checks and smoke script
├── package.json                       npm workspace orchestration
└── README.md                          Setup, architecture, and entry point
```

## Where new files go

| Work | Location |
| --- | --- |
| Browser page or shared component | `frontend/src/pages/` or `frontend/src/components/` |
| Driver, traffic, simulation, routing, prediction, or demo logic | Matching directory under `frontend/src/features/` |
| Browser API calls | `frontend/src/services/` |
| Express routes, state, validation, or operations logic | `backend/server-node/src/` |
| FastAPI routes, schemas, or scoring rules | `backend/server-ai/app/` |
| Shared fictional road, signal, vehicle, and forecast inputs | `shared-data/` |
| Design notes, contracts, how-to guides, and demo documents | `docs/` |
| Repository-level scripts | `scripts/` |

## Documentation to code

| Guide | Main implementation |
| --- | --- |
| `docs/00-simulation-demo/` | `frontend/src/features/simulation/`; Node simulation status in `backend/server-node/src/services/simulationService.js` |
| `docs/01-ambulance-dashboard/` | `frontend/src/features/ambulance/` and `frontend/src/pages/AmbulanceDashboardPage.tsx` |
| `docs/02-traffic-incharge-dashboard/` | `frontend/src/features/traffic/` and `frontend/src/pages/TrafficControlPage.tsx` |
| `docs/03-ai-traffic-prediction/` | `backend/server-ai/app/` and `frontend/src/features/prediction/` |
| `docs/04-backend-realtime/` | `backend/server-node/src/`; WebSocket notes describe future work |
| `docs/05-map-data-routing/` | `shared-data/`, `frontend/src/features/ambulance/ambulanceData.ts`, and `frontend/src/features/routing/` |
| `docs/06-project-management/` | `frontend/src/features/demo/`, demo script, checks, and build plan |

The Node API holds mock operational changes only while its process is running. The browser owns movement and A* routing. FastAPI computes deterministic forecasts without storing requests. See the [data ownership table](../../README.md#data-and-api-ownership).
