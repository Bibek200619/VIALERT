# Ambulance Dashboard UI Requirements

## Main Screen Layout

| Area | Content |
| --- | --- |
| Top bar | Ambulance ID, emergency status, ETA |
| Map | Real map, ambulance marker, route, hospital, signals |
| Route panel | Current route, next turn/junction, distance remaining |
| Signal panel | Upcoming traffic lights and green status |
| Alert panel | Congestion, roadblock, rerouting alerts |

## Map Elements

- Ambulance marker
- Base location marker
- Hospital marker
- Active route polyline
- Green signal markers
- Red/yellow signal markers
- Incident marker

## Suggested UI States

### Idle

No active emergency. Driver can see base location and available routes.

### Active Emergency

Route is visible, ambulance moves, ETA updates, and green lights appear ahead.

### Rerouting

Current route changes because of congestion or blockage.

### Completed

Ambulance reaches destination and trip summary is shown.

## UI Priority

The driver screen must be simple. Avoid too many charts. The driver needs map, route, signal status, and alerts.

