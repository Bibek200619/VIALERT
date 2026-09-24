# Suggested Code File Structure

```text
vialert/
  client/
    src/
      dashboards/
        ambulance/
        traffic-incharge/
      components/
        map/
        signals/
        alerts/
        metrics/
        simulation/
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

## Documentation Mapping

| Documentation Folder | Code Folder |
| --- | --- |
| `00-simulation-demo` | `client/src/components/simulation` and `server-node/src/services/simulationService.js` |
| `01-ambulance-dashboard` | `client/src/dashboards/ambulance` |
| `02-traffic-incharge-dashboard` | `client/src/dashboards/traffic-incharge` |
| `03-ai-traffic-prediction` | `server-ai/app` |
| `04-backend-realtime` | `server-node/src` |
| `05-map-data-routing` | `shared-data` and routing services |
