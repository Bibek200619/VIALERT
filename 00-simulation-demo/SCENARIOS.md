# Simulation Scenarios

## Scenario 1: Normal Emergency Route

The ambulance starts from the base and travels to the hospital using the fastest route.

Expected result:

- Route appears on ambulance dashboard.
- Signals ahead turn green.
- Traffic in-charge receives signal alerts.
- Ambulance reaches hospital.

## Scenario 2: Road Blockage and Rerouting

An accident blocks one road on the ambulance route.

Expected result:

- Blocked road appears on map.
- A* calculates an alternate route.
- Driver dashboard shows rerouting alert.
- Traffic in-charge dashboard logs the event.

## Scenario 3: Manual Signal Control

The traffic in-charge manually changes a signal state.

Expected result:

- Signal changes on both dashboards.
- Event log records operator action.
- Ambulance dashboard reflects updated green/red signal.

## Scenario 4: AI Traffic Prediction

The simulation changes context to office exit time with rain.

Expected result:

- AI predicts high traffic near office district.
- Prediction appears on traffic in-charge dashboard.
- Driver dashboard warns about predicted congestion ahead.
- Route cost can increase for the predicted zone.

## Scenario 5: Multiple Ambulance Alerts

Two ambulance markers are active in different areas.

Expected result:

- Traffic in-charge receives separate alerts.
- Dashboard shows which ambulance is approaching which signal.
- Conflict can be shown if both need the same corridor.

