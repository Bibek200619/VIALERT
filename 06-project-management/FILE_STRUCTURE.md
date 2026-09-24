# Suggested Code File Structure

```text
vialert/
  client/
    src/
      app/
        App.tsx
        routes.tsx
      pages/
        AmbulanceDashboardPage.tsx
        TrafficControlPage.tsx
        SimulationPage.tsx
      features/
        ambulance/
          components/
          hooks/
          ambulanceData.ts
          types.ts
        traffic/
        simulation/
      components/
        map/
        layout/
        navigation/
      services/
        apiClient.ts
        socketClient.ts
      styles/
  server-node/
    src/
      routes/
      services/
        emergencyService.js
        signalService.js
        simulationService.js
        scenarioService.js
      sockets/
      data/
  server-ai/
    app/
      main.py
      model.py
      schemas.py
      sample_data/
  shared-data/
    nodes.json
    roads.json
    signals.json
    hospitals.json
    bases.json
    adjacency.json
  docs/
```

Phase 2 uses browser routes `/ambulance`, `/traffic`, and `/simulation`. The
ambulance page owns the route, deterministic timer journey, driver guidance,
signal awareness, and Leaflet/graph map. Traffic and simulation are separate
placeholder pages. Node and AI service boundaries and the shared fixture format
remain unchanged.

## Documentation Mapping

| Documentation Folder | Code Folder |
| --- | --- |
| `00-simulation-demo` | `client/src/components/simulation` and `server-node/src/services/simulationService.js` |
| `01-ambulance-dashboard` | `client/src/features/ambulance` and `client/src/pages/AmbulanceDashboardPage.tsx` |
| `02-traffic-incharge-dashboard` | `client/src/features/traffic` and `client/src/pages/TrafficControlPage.tsx` |
| `03-ai-traffic-prediction` | `server-ai/app` |
| `04-backend-realtime` | `server-node/src` |
| `05-map-data-routing` | `shared-data` and routing services |
