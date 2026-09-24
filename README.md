# VIALERT MVP Documentation

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
