# Traffic In-charge Dashboard Features

Phase 4 implementation status: `/traffic` now lists and filters demo vehicles,
shows selected route and details, displays mock incidents and alerts,
acknowledges alerts, changes in-memory signal state with priority confirmation,
and presents operations metrics and event history. A same-browser snapshot maps
Phase 3 ambulance movement and scenario events into this view. The map has
Leaflet/OpenStreetMap and SVG graph modes. Node-offline data fallback is included.
All operations are simulated.

## Implemented in Phase 4

- Show all active ambulances on map
- Show live alerts
- Show traffic-light states
- Let operator manually change signal state
- Show emergency corridor status
- Show congestion and blockage overlays from mock incidents
- Filter/select demo ambulance and bus
- Confirm emergency-priority changes
- Acknowledge alerts and filter event history
- Follow same-browser Phase 3 simulation movement

## Later candidates

- Filter by ambulance
- Filter by signal
- Show conflict warning when two ambulances need the same signal
- Show calibrated AI prediction warnings

## Future Features

- Real traffic-light API integration
- Multi-operator roles
- Approval workflow
- Government audit logs
- City-zone management
