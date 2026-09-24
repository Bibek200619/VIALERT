# Testing Plan

## Manual Demo Tests

### Test 1: Start Emergency

Expected result:

- Emergency request becomes active.
- Route appears on map.
- ETA appears in dashboard.

### Test 2: Add Accident

Expected result:

- Road is marked blocked.
- Route recalculates.
- Event log records incident and reroute.

### Test 3: Signal Priority

Expected result:

- Upcoming signal turns priority green.
- Previous signal returns to normal after ambulance passes.

### Test 4: No Available Route

Expected result:

- System shows no route available.
- Dashboard does not crash.

### Test 5: Reset Demo

Expected result:

- Emergency clears.
- Incidents clear.
- Signals return to normal.
- Map returns to initial state.

## Algorithm Tests

- Dijkstra returns shortest path when no congestion exists.
- Congested roads have higher cost.
- Blocked roads are excluded.
- Rerouting changes path after an incident.

## UI Tests

- Dashboard loads without errors.
- Important controls are visible on laptop and projector.
- Colors clearly distinguish route, incident, signal, and ambulance.

