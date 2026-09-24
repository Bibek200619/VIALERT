# Map, Data, and Routing

This module handles real map visualization, hardcoded city graph data, and A* route calculation.

## Map Visualization

Use real-life maps through:

- Leaflet with OpenStreetMap tiles
- Mapbox
- Google Maps API if available

For the MVP, Leaflet + OpenStreetMap is the easiest option because it can work without paid setup.

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

## Routing Algorithm

Use A* algorithm to calculate the best route from ambulance base to hospital.

Route cost should consider:

- road distance,
- congestion level,
- blocked roads,
- predicted congestion,
- signal priority if needed.

