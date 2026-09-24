# Map, Data, and Routing

This module handles real map visualization, hardcoded city graph data, A* route calculation, and the optional 3D simulation layer.

## Map Visualization

Use real-life maps through:

- Leaflet with OpenStreetMap tiles
- Mapbox
- Google Maps API if available

For the MVP, Leaflet + OpenStreetMap is the easiest option because it can work without paid setup.

## Bengaluru Demo Area

The MVP should use a small Bengaluru-inspired route area rather than trying to model the entire city.

Suggested demo zones:

- MG Road
- Indiranagar
- Koramangala
- Silk Board
- Electronic City route
- Whitefield route
- nearest major hospital in the selected route

The map can use real Bengaluru coordinates, while the route engine uses a simplified hardcoded graph.

## 3D Simulation Layer

The 3D layer should be a stylized driving simulation, not a full photorealistic reconstruction of Bengaluru.

Minimum 3D scope:

- road lanes,
- ambulance model or simple emergency vehicle mesh,
- surrounding buildings/blocks,
- green emergency corridor strip,
- traffic signal markers,
- accident/construction/rain/flood markers,
- camera modes: driver view, third-person view, optional rear-view mirror.

Use the same graph and route state for both map view and 3D view.

## City Graph

The actual route calculation should use a simplified graph, even if the map is real. This keeps the MVP manageable.

## Data Files

Suggested files:

- `nodes.json`
- `roads.json`
- `signals.json`
- `hospitals.json`
- `bases.json`
- `adjacency.json`
- `scenarios.json`

## Routing Algorithm

Use A* algorithm to calculate the best route from ambulance base to hospital.

Route cost should consider:

- road distance,
- congestion level,
- blocked roads,
- predicted congestion,
- signal priority if needed,
- scenario impact such as accident, construction, rain, or flood.

## Location Selection

The demo should let the user select:

- ambulance start point,
- hospital/destination,
- scenario type,
- scenario location.

For the first version, selection can be from preset dropdowns. If time allows, clicking directly on the map to place the scenario is better for judges.
