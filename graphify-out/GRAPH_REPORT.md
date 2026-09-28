# Graph Report - .  (2026-09-28)

## Corpus Check
- 155 files · ~54,975 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 650 nodes · 1559 edges · 36 communities (31 shown, 5 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 68 edges (avg confidence: 0.55)
- Token cost: 161,597 input · 6,024 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Traffic Control Components|Traffic Control Components]]
- [[_COMMUNITY_Express Operations API|Express Operations API]]
- [[_COMMUNITY_Ambulance Route Planner|Ambulance Route Planner]]
- [[_COMMUNITY_Route Hazards and Costs|Route Hazards and Costs]]
- [[_COMMUNITY_Python Forecast Service|Python Forecast Service]]
- [[_COMMUNITY_Browser Routing and Reset|Browser Routing and Reset]]
- [[_COMMUNITY_Traffic Forecast UI|Traffic Forecast UI]]
- [[_COMMUNITY_Frontend Runtime Dependencies|Frontend Runtime Dependencies]]
- [[_COMMUNITY_Root Build Scripts|Root Build Scripts]]
- [[_COMMUNITY_Workspace Components|Workspace Components]]
- [[_COMMUNITY_Simulation UI Controls|Simulation UI Controls]]
- [[_COMMUNITY_Simulation Map and Projection|Simulation Map and Projection]]
- [[_COMMUNITY_Driver and Operations Maps|Driver and Operations Maps]]
- [[_COMMUNITY_TypeScript Build Settings|TypeScript Build Settings]]
- [[_COMMUNITY_Three.js City Scene|Three.js City Scene]]
- [[_COMMUNITY_Cross-Feature Journey Logic|Cross-Feature Journey Logic]]
- [[_COMMUNITY_Incident Storage and Sync|Incident Storage and Sync]]
- [[_COMMUNITY_Node TypeScript Configuration|Node TypeScript Configuration]]
- [[_COMMUNITY_Node Service Dependencies|Node Service Dependencies]]
- [[_COMMUNITY_Simulation Guidance Controls|Simulation Guidance Controls]]
- [[_COMMUNITY_Simulation Timeline Events|Simulation Timeline Events]]
- [[_COMMUNITY_Project Docs and System Map|Project Docs and System Map]]
- [[_COMMUNITY_Scenario Templates|Scenario Templates]]
- [[_COMMUNITY_Forecast Model Checks|Forecast Model Checks]]
- [[_COMMUNITY_Simulation Scenario Settings|Simulation Scenario Settings]]
- [[_COMMUNITY_Fixture Integrity Checks|Fixture Integrity Checks]]
- [[_COMMUNITY_TypeScript Project References|TypeScript Project References]]
- [[_COMMUNITY_Python Service Package|Python Service Package]]
- [[_COMMUNITY_Realtime Client Stub|Realtime Client Stub]]
- [[_COMMUNITY_AI Service Identity|AI Service Identity]]
- [[_COMMUNITY_Prediction Insight UI|Prediction Insight UI]]

## God Nodes (most connected - your core abstractions)
1. `CityData` - 43 edges
2. `SimulationState` - 21 edges
3. `ForecastInput` - 18 edges
4. `findRoute()` - 17 edges
5. `scripts` - 16 edges
6. `PredictionInput` - 15 edges
7. `Prediction` - 15 edges
8. `Forecast` - 15 edges
9. `formatDistance()` - 15 edges
10. `simulationReducer()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `VIALERT Project Guide` --references--> `React Frontend Entry`  [EXTRACTED]
  README.md → frontend/src/main.tsx
- `In-memory Data Store` --references--> `City Nodes Fixture`  [INFERRED]
  backend/server-node/src/data/store.js → shared-data/nodes.json
- `SimulationPage` --references--> `apiClient`  [INFERRED]
  frontend/src/pages/SimulationPage.tsx → frontend/src/services/apiClient.ts
- `TrafficControlPage` --references--> `apiClient`  [INFERRED]
  frontend/src/pages/TrafficControlPage.tsx → frontend/src/services/apiClient.ts
- `VIALERT Root` --references--> `React Frontend Entry`  [EXTRACTED]
  package.json → frontend/src/main.tsx

## Import Cycles
- None detected.

## Communities (36 total, 5 thin omitted)

### Community 0 - "Traffic Control Components"
Cohesion: 0.07
Nodes (61): findRoute(), formatDistance(), formatDuration(), AlertPanel(), CityOverview(), EventLog(), IncidentControlPanel(), types (+53 more)

### Community 1 - "Express Operations API"
Cohesion: 0.09
Nodes (40): collectionNames, createStore(), dataDirectory, loadCity(), createApiRouter(), createEmergency(), listEmergencies(), acknowledgeAlert() (+32 more)

### Community 2 - "Ambulance Route Planner"
Cohesion: 0.09
Nodes (39): advanceJourney(), bearing(), createInitialJourney(), demoCityData, describeTurn(), distanceBetweenNodes(), formatSimulationTime(), generateVoiceGuidance() (+31 more)

### Community 3 - "Route Hazards and Costs"
Cohesion: 0.11
Nodes (41): displayNames, EnvironmentPanel(), buildDynamicGraph(), calculateRoadCost(), congestionLevels, congestionMultiplier, congestionRank, etaDifference() (+33 more)

### Community 4 - "Python Forecast Service"
Cohesion: 0.17
Nodes (31): forecast(), forecast_batch(), get_predictions(), predict(), HTTP entry point for the stateless Phase 6 forecast and legacy mock API., area_name(), calculate_risk_score(), classify_congestion() (+23 more)

### Community 5 - "Browser Routing and Reset"
Cohesion: 0.10
Nodes (22): AmbulanceDashboardPage, requestWithFallback, App(), AppRoutes(), clearDemoStorage(), DEMO_STORAGE_KEYS, DemoResetResult, DemoStorage (+14 more)

### Community 6 - "Traffic Forecast UI"
Cohesion: 0.17
Nodes (22): areaName(), TrafficForecast(), areaBaseline, areaName(), buildForecastInputs(), combineCostMultipliers(), DEFAULT_PREDICTION_SETTINGS, explainForecastRouteEffect() (+14 more)

### Community 7 - "Frontend Runtime Dependencies"
Cohesion: 0.07
Nodes (26): dependencies, leaflet, react, react-dom, react-leaflet, react-router, three, devDependencies (+18 more)

### Community 8 - "Root Build Scripts"
Cohesion: 0.08
Nodes (25): description, devDependencies, concurrently, engines, node, name, private, scripts (+17 more)

### Community 9 - "Workspace Components"
Cohesion: 0.12
Nodes (11): Icon(), IconName, paths, items, TrafficSidebar(), WorkspacePlaceholder(), WorkspacePlaceholderProps, initialSnapshot (+3 more)

### Community 10 - "Simulation UI Controls"
Cohesion: 0.15
Nodes (14): CameraModeSelector(), modes, ScenarioPanel(), SimulationHeader(), VehiclePanel(), VehiclePanelProps, ApiConnection, useSimulation() (+6 more)

### Community 11 - "Simulation Map and Projection"
Cohesion: 0.16
Nodes (15): markerIcon(), Simulation3DScene, SimulationMap(), Road, getSimulationRoutePlan(), getSimulationPosition(), getSimulationRoadPath(), getSimulationRoadPaths() (+7 more)

### Community 12 - "Driver and Operations Maps"
Cohesion: 0.19
Nodes (10): RoutePlan, RoutePosition, markerIcon(), NavigationMap(), NavigationMapProps, FocusMode, GraphMap(), GraphMapProps (+2 more)

### Community 13 - "TypeScript Build Settings"
Cohesion: 0.12
Nodes (16): compilerOptions, erasableSyntaxOnly, jsx, lib, module, moduleResolution, noEmit, noUnusedLocals (+8 more)

### Community 14 - "Three.js City Scene"
Cohesion: 0.20
Nodes (12): addVehicle(), cleanName(), Color, makeBox(), material(), Simulation3DScene(), Simulation3DSceneProps, SimulationMapProps (+4 more)

### Community 15 - "Cross-Feature Journey Logic"
Cohesion: 0.13
Nodes (15): buildDynamicGraph, getHazardAffectedRoadIds, incidentToHazard, buildForecastInputs, forecastCostMultipliers, predictLocally, PredictionPanel, createInitialSimulationState (+7 more)

### Community 16 - "Incident Storage and Sync"
Cohesion: 0.22
Nodes (12): currentSnapshot(), HazardType, incidentToHazard(), readBrowserIncidents(), readLocalIncidents(), sameIncidents(), writeBrowserIncidents(), writeLocalIncidents() (+4 more)

### Community 17 - "Node TypeScript Configuration"
Cohesion: 0.14
Nodes (13): compilerOptions, lib, module, moduleResolution, noEmit, noUnusedLocals, noUnusedParameters, skipLibCheck (+5 more)

### Community 18 - "Node Service Dependencies"
Cohesion: 0.14
Nodes (13): dependencies, cors, express, engines, node, name, private, scripts (+5 more)

### Community 19 - "Simulation Guidance Controls"
Cohesion: 0.23
Nodes (9): EnvironmentPanelProps, available(), ScenarioVoiceAlerts(), ScenarioVoiceAlertsProps, SimulationControls(), SimulationControlsProps, speeds, SimulationSpeed (+1 more)

### Community 20 - "Simulation Timeline Events"
Cohesion: 0.27
Nodes (8): EventTimeline(), EventTimelineProps, labels, ScenarioRoadEffects, SimulationEvent, SimulationEventType, SimulationStatus, VehiclePriority

### Community 23 - "Project Docs and System Map"
Cohesion: 0.22
Nodes (9): VIALERT Agent System, React Frontend Entry, App Routes, VIALERT Root, VIALERT Project Guide, FastAPI AI Service, Deterministic Forecast Model, Express Node API (+1 more)

### Community 24 - "Scenario Templates"
Cohesion: 0.25
Nodes (8): ScenarioPreset, defaultVehicleConfiguration, emptyRoute, isScenarioType(), scenarioFromPreset(), scenarioTypes, severities, ScenarioType

### Community 25 - "Forecast Model Checks"
Cohesion: 0.36
Nodes (5): forecast(), Phase 6 deterministic forecast and request validation tests., test_accident_and_flood_can_make_forecast_severe(), test_office_peak_and_rain_raise_risk(), test_priority_reduces_eta_without_hiding_road_risk()

### Community 26 - "Simulation Scenario Settings"
Cohesion: 0.53
Nodes (5): ScenarioPanelProps, typeLabels, SimulationController, Scenario, ScenarioSeverity

### Community 27 - "Fixture Integrity Checks"
Cohesion: 0.40
Nodes (3): nodeIds, [nodes, roads, signals, hospitals, bases, scenarios, adjacency, vehicles, predictionInputs], roadById

## Knowledge Gaps
- **163 isolated node(s):** `vialert-ai`, `name`, `version`, `private`, `type` (+158 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `CityData` connect `Three.js City Scene` to `Traffic Control Components`, `Ambulance Route Planner`, `Route Hazards and Costs`, `Traffic Forecast UI`, `Workspace Components`, `Simulation UI Controls`, `Simulation Map and Projection`, `Driver and Operations Maps`, `Incident Storage and Sync`, `Simulation Guidance Controls`, `Simulation Timeline Events`, `Scenario Templates`, `Simulation Scenario Settings`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Why does `City Nodes Fixture` connect `Ambulance Route Planner` to `Project Docs and System Map`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `In-memory Data Store` connect `Project Docs and System Map` to `Ambulance Route Planner`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `ForecastInput` (e.g. with `ForecastInput` and `Prediction`) actually correct?**
  _`ForecastInput` has 10 INFERRED edges - model-reasoned connections that need verification._
- **What connects `VIALERT Phase 1 mock traffic prediction service.`, `HTTP entry point for the stateless Phase 6 forecast and legacy mock API.`, `Small deterministic demo rules; this module does not train or run an AI model.` to the rest of the system?**
  _169 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Traffic Control Components` be split into smaller, more focused modules?**
  _Cohesion score 0.06593707250341997 - nodes in this community are weakly interconnected._
- **Should `Express Operations API` be split into smaller, more focused modules?**
  _Cohesion score 0.09216255442670537 - nodes in this community are weakly interconnected._