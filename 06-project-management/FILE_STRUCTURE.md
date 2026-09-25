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
          components/ (fleet, map, alerts, signal, event, metrics panels)
          hooks/useTrafficOperations.ts
          trafficData.ts
          trafficTypes.ts
          trafficUtils.ts
        simulation/
          components/
          hooks/
          simulationEngine.ts
          simulationEngine.test.ts
          simulationTypes.ts
          simulationData.ts
          simulationSnapshot.ts
        routing/
          dynamicRouting.ts
          incidentFeed.ts
          useRouteConditions.ts
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
        operationsService.js
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
    vehicles.json
  docs/
```

Phase 3 retains browser routes `/ambulance`, `/traffic`, and `/simulation`. The
ambulance feature owns driver navigation; the simulation feature owns its pure
deterministic reducer, timer hook, scenario overlays, timeline, controls, and
map presentation. The traffic feature owns the operator page, fleet mapping,
polling, panels, and same-browser simulation snapshot. The routing feature owns
Phase 5 cost factors, incident projection, and the driver condition feed. Node
owns mock signal, incident, alert, and event records but does not advance the
client's simulation clock or calculate a production route.

## Documentation Mapping

| Documentation Folder | Code Folder |
| --- | --- |
| `00-simulation-demo` | `client/src/features/simulation` and `server-node/src/services/simulationService.js`, `scenarioService.js` |
| `01-ambulance-dashboard` | `client/src/features/ambulance` and `client/src/pages/AmbulanceDashboardPage.tsx` |
| `02-traffic-incharge-dashboard` | `client/src/features/traffic` and `client/src/pages/TrafficControlPage.tsx` |
| `03-ai-traffic-prediction` | `server-ai/app` |
| `04-backend-realtime` | `server-node/src` |
| `05-map-data-routing` | `shared-data` and `client/src/features/routing` |
